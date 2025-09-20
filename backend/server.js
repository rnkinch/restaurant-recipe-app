// server.js (With fix for issue c: parse ingredients from JSON string)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ quiet: true });

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  console.log('Static request for:', req.path);
  next();
}, express.static('/app/uploads'));

app.use('/uploads', (err, req, res, next) => {
  if (err) {
    console.error('Static serve error:', err.message, 'for path:', req.path);
    res.status(404).send('File not found');
  } else {
    next();
  }
});

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
    const filename = Date.now() + path.extname(file.originalname || '');
    console.log('Saving file:', filename);
    cb(null, filename);
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
  limits: { fileSize: 5 * 1024 * 1024 }
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

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/recipeDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

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
    quantity: { type: String, required: true },  // Changed to String for flexibility
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

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running', timestamp: new Date().toISOString() });
});

// Purveyors routes
app.get('/purveyors', async (req, res) => {
  try {
    const purveyors = await Purveyor.find().sort({ name: 1 });
    res.json(purveyors);
  } catch (err) {
    console.error('Get purveyors error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/purveyors', async (req, res) => {
  try {
    const purveyor = new Purveyor(req.body);
    await purveyor.save();
    res.status(201).json(purveyor);
  } catch (err) {
    console.error('Create purveyor error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/purveyors/:id', async (req, res) => {
  try {
    const purveyor = await Purveyor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!purveyor) return res.status(404).json({ error: 'Purveyor not found' });
    res.json(purveyor);
  } catch (err) {
    console.error('Update purveyor error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/purveyors/:id', async (req, res) => {
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
app.get('/ingredients', async (req, res) => {
  try {
    const ingredients = await Ingredient.find().populate('purveyor').sort({ name: 1 });
    res.json(ingredients);
  } catch (err) {
    console.error('Get ingredients error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/ingredients', async (req, res) => {
  try {
    const ingredient = new Ingredient(req.body);
    await ingredient.save();
    const populatedIngredient = await Ingredient.findById(ingredient._id).populate('purveyor');
    res.status(201).json(populatedIngredient);
  } catch (err) {
    console.error('Create ingredient error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/ingredients/:id', async (req, res) => {
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

app.delete('/ingredients/:id', async (req, res) => {
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
app.get('/recipes', async (req, res) => {
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

app.get('/recipes/:id', async (req, res) => {
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

app.post('/recipes', upload.single('image'), async (req, res) => {
  try {
    const { name, steps, platingGuide, allergens, serviceTypes, active } = req.body;
    
    // Parse ingredients from JSON string
    const ingredients = JSON.parse(req.body.ingredients || '[]');

    const recipeData = {
      name,
      ingredients,
      steps,
      platingGuide,
      allergens: JSON.parse(allergens || '[]'),
      serviceTypes: JSON.parse(serviceTypes || '[]'),
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

app.put('/recipes/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, steps, platingGuide, allergens, serviceTypes, active, removeImage } = req.body;
    
    // Parse ingredients from JSON string
    const ingredients = JSON.parse(req.body.ingredients || '[]');

    const recipeData = {
      name,
      ingredients,
      steps,
      platingGuide,
      allergens: JSON.parse(allergens || '[]'),
      serviceTypes: JSON.parse(serviceTypes || '[]'),
      active: active === 'true'
    };
    if (req.file) {
      recipeData.image = `/uploads/${req.file.filename}`;
    } else if (removeImage === 'true') {
      recipeData.image = null;
    }
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, recipeData, { new: true });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    const populatedRecipe = await Recipe.findById(recipe._id).populate({
      path: 'ingredients.ingredient',
      populate: { path: 'purveyor' }
    });
    res.json(populatedRecipe);
  } catch (err) {
    console.error('Update recipe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT} at ${new Date().toISOString()}`);
});
