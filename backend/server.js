const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ quiet: true });


// Import security middleware
const { 
  generalLimiter, 
  authLimiter, 
  uploadLimiter, 
  securityHeaders, 
  sanitizeInput, 
  noSqlInjectionProtection,
  validateFileUpload, 
  securityLogger 
} = require('./middleware/security');
const { authenticateToken, requireAdmin, requireUser, requireEditPermission, requireReadOnly } = require('./middleware/auth');
const { validateRecipe, validateIngredient, validatePurveyor, sanitizeInputs } = require('./middleware/validation');
const { logRecipeChange, captureChanges, logRecipeUpdate, logUpdateResult } = require('./middleware/changelog');
const { metricsMiddleware } = require('./middleware/metrics');
const { register } = require('./utils/metrics');
const logger = require('./utils/logger');

const app = express();
// Secure CORS configuration
const allowedOrigins = [
  // Development origins (only in development)
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.68.129:3000', // Your Windows host IP
    'http://172.30.184.138:3000', // Your WSL local IP
  ] : []),
  // Production origins
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS?.split(',') || []
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  credentials: true, // Enable credentials for authentication
  optionsSuccessStatus: 200
}));

// Serve static files FIRST - before ANY other middleware
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploads with CORS for allowed origins
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  console.log('Serving static file:', req.path, 'for origin:', origin);
  next();
}, express.static('/app/uploads'));

// Apply security middleware to API routes only
app.use(securityHeaders);
app.use(securityLogger);
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(noSqlInjectionProtection);
app.use(generalLimiter);

// Apply metrics middleware to all routes
app.use(metricsMiddleware);

// No additional error handler needed - express.static handles this

const uploadsDir = '/app/uploads';
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
  } else {
    console.log('Uploads directory exists:', uploadsDir);
  }
  fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
  console.log('Uploads directory readable/writable');
} catch (err) {
  console.error('Uploads directory setup failed:', err.message);
  process.exit(1);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      console.log('Multer destination accessible:', uploadsDir);
      cb(null, uploadsDir);
    } catch (err) {
      console.error('Multer destination not writable:', err.message);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'logo') {
      cb(null, 'logo.png'); // Force filename to logo.png for logo uploads
    } else {
      const filename = Date.now() + path.extname(file.originalname || '');
      console.log('Saving file:', filename);
      cb(null, filename);
    }
  }
});

const fileFilter = (req, file, cb) => {
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
    const err = new Error('Only JPEG/PNG allowed');
    console.error(err.message);
    cb(err, false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only 1 file at a time
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

app.use((req, res, next) => {
  if (req.file) {
    const filePath = path.join(uploadsDir, req.file.filename);
    console.log('Verifying file:', filePath);
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      console.log('File saved and verified:', req.file.filename);
    } catch (err) {
      console.error('Post-upload failure:', err.message);
      req.fileError = err.message;
    }
  }
  next();
});

// MongoDB connection - use localhost for single-container deployment
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/recipeDB';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => logger.info('MongoDB connected successfully'))
  .catch(err => logger.error('MongoDB connection error:', err));

const purveyorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
});
purveyorSchema.index({ name: 'text' });
const Purveyor = mongoose.model('Purveyor', purveyorSchema);

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  purveyor: { type: mongoose.Schema.Types.ObjectId, ref: 'Purveyor', required: true }
});
ingredientSchema.index({ name: 'text' });
ingredientSchema.index({ purveyor: 1 });
const Ingredient = mongoose.model('Ingredient', ingredientSchema);

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ingredients: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantity: { type: String, required: true },
    measure: { type: String, required: true }
  }],
  steps: { type: String, required: true, trim: true },
  platingGuide: { type: String, required: true, trim: true },
  allergens: [String],
  serviceTypes: [String],
  image: String,
  active: { type: Boolean, default: true }
});
const Recipe = mongoose.model('Recipe', recipeSchema);

const Config = require('./Config');
const { User } = require('./middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Authentication routes
app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Enhanced password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
      });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Record successful authentication
    const { recordAuthenticationAttempt } = require('./utils/metrics');
    recordAuthenticationAttempt(true);
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        isActive: user.isActive
      } 
    });
  } catch (err) {
    // Record failed authentication
    const { recordAuthenticationAttempt } = require('./utils/metrics');
    recordAuthenticationAttempt(false);
    
    logger.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Configuration routes (public for frontend initialization)
app.get('/config', async (req, res) => {
  try {
    const config = await Config.findOrCreate();
    res.json(config);
  } catch (err) {
    console.error('Get config error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { appName, showLeftNav } = req.body;
    const config = await Config.findOne();
    if (!config) {
      const newConfig = new Config({ appName, showLeftNav });
      await newConfig.save();
      res.json(newConfig);
    } else {
      config.appName = appName;
      config.showLeftNav = showLeftNav;
      await config.save();
      res.json(config);
    }
  } catch (err) {
    console.error('Update config error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/config/logo', uploadLimiter, authenticateToken, requireAdmin, upload.single('logo'), validateFileUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }
    res.status(201).json({ message: 'Logo uploaded successfully', filename: req.file.filename });
  } catch (err) {
    console.error('Upload logo error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running', timestamp: new Date().toISOString() });
});

// Development endpoint to reset rate limits (only in development)
if (process.env.NODE_ENV === 'development') {
  app.post('/dev/reset-rate-limits', (req, res) => {
    try {
      // Clear rate limit stores
      generalLimiter.resetKey(req.ip);
      authLimiter.resetKey(req.ip);
      uploadLimiter.resetKey(req.ip);
      res.json({ 
        message: 'Rate limits reset for IP: ' + req.ip,
        limits: {
          general: '1000 requests per 15 minutes',
          auth: '50 requests per 15 minutes', 
          uploads: '100 uploads per 15 minutes'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset rate limits: ' + error.message });
    }
  });
}

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Apply metrics middleware to all routes (moved to top)

// Test endpoint to check if uploads directory and files exist
app.get('/test-uploads', (req, res) => {
  try {
    const files = fs.readdirSync('/app/uploads');
    res.json({ 
      status: 'OK', 
      uploadsDir: '/app/uploads',
      files: files,
      count: files.length 
    });
  } catch (err) {
    res.json({ 
      status: 'ERROR', 
      error: err.message,
      uploadsDir: '/app/uploads'
    });
  }
});

// Public endpoint for frontend to check if authentication is required
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'OK', 
    authentication: 'required',
    endpoints: {
      login: '/auth/login',
      register: '/auth/register'
    }
  });
});

// Purveyors routes
app.get('/purveyors', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const purveyors = await Purveyor.find().sort({ name: 1 });
    res.json(purveyors);
  } catch (err) {
    console.error('Get purveyors error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/purveyors', authenticateToken, requireEditPermission, sanitizeInputs, validatePurveyor, async (req, res) => {
  try {
    const purveyor = new Purveyor(req.body);
    await purveyor.save();
    res.status(201).json(purveyor);
  } catch (err) {
    console.error('Create purveyor error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/purveyors/:id', authenticateToken, requireEditPermission, sanitizeInputs, validatePurveyor, async (req, res) => {
  try {
    const purveyor = await Purveyor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!purveyor) return res.status(404).json({ error: 'Purveyor not found' });
    res.json(purveyor);
  } catch (err) {
    console.error('Update purveyor error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/purveyors/:id', authenticateToken, requireEditPermission, async (req, res) => {
  try {
    const purveyor = await Purveyor.findByIdAndDelete(req.params.id);
    if (!purveyor) return res.status(404).json({ error: 'Purveyor not found' });
    res.json({ message: 'Purveyor deleted' });
  } catch (err) {
    console.error('Delete purveyor error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ingredients routes
app.get('/ingredients', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const ingredients = await Ingredient.find().populate('purveyor').sort({ name: 1 });
    res.json(ingredients);
  } catch (err) {
    console.error('Get ingredients error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/ingredients', authenticateToken, requireEditPermission, sanitizeInputs, validateIngredient, async (req, res) => {
  try {
    // Check if ingredient already exists
    const existingIngredient = await Ingredient.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } 
    });
    
    if (existingIngredient) {
      return res.status(400).json({ 
        error: `Ingredient "${req.body.name}" already exists. Please choose a different name.`
      });
    }
    
    const ingredient = new Ingredient(req.body);
    await ingredient.save();
    const populatedIngredient = await Ingredient.findById(ingredient._id).populate('purveyor');
    res.status(201).json(populatedIngredient);
  } catch (err) {
    console.error('Create ingredient error:', err.message);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: `Ingredient "${req.body.name}" already exists. Please choose a different name.`
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

app.put('/ingredients/:id', authenticateToken, requireEditPermission, sanitizeInputs, validateIngredient, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    const populatedIngredient = await Ingredient.findById(ingredient._id).populate('purveyor');
    res.json(populatedIngredient);
  } catch (err) {
    console.error('Update ingredient error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/ingredients/:id', authenticateToken, requireEditPermission, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    res.json({ message: 'Ingredient deleted' });
  } catch (err) {
    console.error('Delete ingredient error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Recipes routes
app.get('/recipes', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const { ingredient, active } = req.query;
    const query = {};
    if (ingredient) query['ingredients.ingredient'] = ingredient;
    if (active === 'true') query.active = true;
    const recipes = await Recipe.find(query).populate({
      path: 'ingredients.ingredient',
      populate: { path: 'purveyor' }
    }).sort({ name: 1 });
    res.json(recipes);
  } catch (err) {
    console.error('Get recipes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/recipes/:id', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate({
      path: 'ingredients.ingredient',
      populate: { path: 'purveyor' }
    });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    console.error('Get recipe by ID error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/recipes', uploadLimiter, authenticateToken, requireEditPermission, upload.single('image'), validateFileUpload, sanitizeInputs, validateRecipe, logRecipeChange('created'), async (req, res) => {
  try {
    const { name, steps, platingGuide, allergens, serviceTypes, active } = req.body;
    
    // Use ingredients (already parsed by validation middleware)
    const ingredients = req.body.ingredients || [];

    // Use allergens and serviceTypes (already parsed by validation middleware)
    const parsedAllergens = req.body.allergens || [];
    const parsedServiceTypes = req.body.serviceTypes || [];

    const recipeData = {
      name,
      ingredients,
      steps,
      platingGuide,
      allergens: parsedAllergens,
      serviceTypes: parsedServiceTypes,
      active: active === 'true'
    };
    if (req.file) {
      recipeData.image = `/uploads/${req.file.filename}`;
    }
    const recipe = new Recipe(recipeData);
    await recipe.save();
    const populatedRecipe = await Recipe.findById(recipe._id).populate({
      path: 'ingredients.ingredient',
      populate: { path: 'purveyor' }
    });
    res.status(201).json(populatedRecipe);
  } catch (err) {
    console.error('Create recipe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


app.put('/recipes/:id', uploadLimiter, authenticateToken, requireEditPermission, upload.single('image'), validateFileUpload, sanitizeInputs, validateRecipe, captureChanges, logRecipeUpdate, async (req, res) => {
  try {
    const { name, steps, platingGuide, allergens, serviceTypes, active, removeImage } = req.body;
    
    // Use ingredients (already parsed by validation middleware)
    const ingredients = req.body.ingredients || [];

    // Use allergens and serviceTypes (already parsed by validation middleware)
    const parsedAllergens = req.body.allergens || [];
    const parsedServiceTypes = req.body.serviceTypes || [];

    const recipeData = {
      name,
      ingredients,
      steps,
      platingGuide,
      allergens: parsedAllergens,
      serviceTypes: parsedServiceTypes,
      active: active === 'true'
    };
    
    if (req.file) {
      recipeData.image = `/uploads/${req.file.filename}`;
    } else if (removeImage === 'true') {
      recipeData.image = null;
    }
    
    // Get the original recipe data BEFORE updating
    const originalRecipe = await Recipe.findById(req.params.id);
    if (!originalRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    let recipe;
    try {
      recipe = await Recipe.findByIdAndUpdate(req.params.id, recipeData, { new: true });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return res.status(500).json({ error: 'Database update failed' });
    }
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    let populatedRecipe;
    try {
      populatedRecipe = await Recipe.findById(recipe._id).populate({
        path: 'ingredients.ingredient',
        populate: { path: 'purveyor' }
      });
    } catch (populateError) {
      console.error('Population error:', populateError);
      return res.status(500).json({ error: 'Failed to populate recipe data' });
    }
    
    // Store processed data for changelog
    req.processedRecipeData = recipeData;
    
    // Check for image changes and log them separately
    if (req.file) {
      // Image was uploaded
      console.log('Image upload detected:', { 
        recipeId: req.params.id, 
        recipeName: recipe.name,
        from: originalRecipe.image,
        to: recipeData.image 
      });
      await ChangeLog.create({
        user: req.user.userId || req.user._id,
        username: req.user.username,
        recipe: req.params.id,
        recipeName: recipe.name,
        action: 'image_uploaded',
        changes: { image: { from: originalRecipe.image || null, to: recipeData.image } },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    } else if (removeImage === 'true' && originalRecipe.image) {
      // Image was removed
      console.log('Image removal detected:', { 
        recipeId: req.params.id, 
        recipeName: recipe.name,
        from: originalRecipe.image,
        to: null 
      });
      await ChangeLog.create({
        user: req.user.userId || req.user._id,
        username: req.user.username,
        recipe: req.params.id,
        recipeName: recipe.name,
        action: 'image_removed',
        changes: { image: { from: originalRecipe.image, to: null } },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Log the update result
    await logUpdateResult(req, res, () => {});
    
    res.json(populatedRecipe);
  } catch (err) {
    console.error('Recipe update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/recipes/:id', authenticateToken, requireEditPermission, logRecipeChange('deleted'), async (req, res) => {
  try {
    // First, get the recipe to capture its name before deletion
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    
    // Log the deletion with the recipe name
    const ChangeLog = require('./models/ChangeLog');
    await ChangeLog.create({
      user: req.user.userId || req.user._id,
      username: req.user.username,
      recipe: req.params.id,
      recipeName: recipe.name,
      action: 'deleted',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    // Now delete the recipe
    await Recipe.findByIdAndDelete(req.params.id);
    
    if (recipe.image) {
      const imagePath = path.join(uploadsDir, path.basename(recipe.image));
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Failed to delete image:', err.message);
      });
    }
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    console.error('Delete recipe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const templateRoutes = require('./routes/templates');
app.use('/templates', templateRoutes);

// Change log routes
const changelogRoutes = require('./routes/changelog');
app.use('/api/changelog', changelogRoutes);

// User management routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Bulk upload routes
const bulkUploadRoutes = require('./routes/bulkUpload');
app.use('/api/bulk-upload', bulkUploadRoutes);

// Schedule cleanup of old change logs (runs daily at 2 AM)
const schedule = require('node-schedule');
const ChangeLog = require('./models/ChangeLog');

// Clean up old change logs daily at 2 AM
schedule.scheduleJob('0 2 * * *', async () => {
  try {
    console.log('Running scheduled change log cleanup...');
    await ChangeLog.cleanupOldLogs();
  } catch (error) {
    console.error('Error during scheduled cleanup:', error);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT} at ${new Date().toISOString()}`);
  console.log(`Backend API available at: http://localhost:${PORT}`);
  console.log(`Backend API available on network at: http://[YOUR_IP]:${PORT}`);
  console.log('📋 Change log system initialized with 14-day retention policy');
});