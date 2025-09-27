const ChangeLog = require('../models/ChangeLog');

/**
 * Middleware to log recipe changes
 * @param {string} action - The action being performed (created, updated, deleted, etc.)
 * @param {Object} options - Additional options for logging
 */
const logRecipeChange = (action, options = {}) => {
  return async (req, res, next) => {
    try {
      // Only log if user is authenticated
      if (!req.user) {
        return next();
      }

      const { recipeId, recipeName } = options;
      let targetRecipeId = recipeId;
      let targetRecipeName = recipeName;

      // Extract recipe info from request if not provided
      if (!targetRecipeId && req.params.id) {
        targetRecipeId = req.params.id;
      }

      if (!targetRecipeName && req.body && req.body.name) {
        targetRecipeName = req.body.name;
      }

      // For updates, we might need to get the recipe name from the database
      if (!targetRecipeName && targetRecipeId && action === 'updated') {
        try {
          const Recipe = require('../models/Recipe');
          const recipe = await Recipe.findById(targetRecipeId);
          if (recipe) {
            targetRecipeName = recipe.name;
          }
        } catch (err) {
          console.error('Error fetching recipe name for changelog:', err);
        }
      }

      // Create the change log entry
      const changeLogEntry = {
        user: req.user.userId || req.user._id,
        username: req.user.username,
        recipe: targetRecipeId,
        recipeName: targetRecipeName || 'Unknown Recipe',
        action: action,
        changes: options.changes || null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      // Save the change log entry
      await ChangeLog.create(changeLogEntry);
      
      console.log(`Change logged: ${action} by ${req.user.username} on recipe ${targetRecipeName}`);
      
    } catch (error) {
      console.error('Error logging recipe change:', error);
      // Don't fail the request if logging fails
    }
    
    next();
  };
};

/**
 * Middleware to log recipe views
 */
const logRecipeView = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const recipeId = req.params.id;
    if (!recipeId) {
      return next();
    }

    // Get recipe name
    const Recipe = require('../models/Recipe');
    const recipe = await Recipe.findById(recipeId);
    
    if (recipe) {
      await ChangeLog.create({
        user: req.user.userId || req.user._id,
        username: req.user.username,
        recipe: recipeId,
        recipeName: recipe.name,
        action: 'viewed',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
  } catch (error) {
    console.error('Error logging recipe view:', error);
  }
  
  next();
};

/**
 * Middleware to capture changes in request body for updates
 */
const captureChanges = (req, res, next) => {
  if (req.method === 'PUT' || req.method === 'PATCH') {
    req.originalBody = JSON.parse(JSON.stringify(req.body));
  }
  next();
};

/**
 * Helper function to get changes between old and new data
 */
const getChanges = (oldData, newData) => {
  const changes = {};
  
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        from: oldData[key],
        to: newData[key]
      };
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null;
};

/**
 * Middleware to log recipe updates with detailed changes
 */
const logRecipeUpdate = async (req, res, next) => {
  try {
    if (!req.user || req.method !== 'PUT') {
      return next();
    }

    const recipeId = req.params.id;
    if (!recipeId) {
      return next();
    }

    // Get the original recipe data
    const Recipe = require('../models/Recipe');
    const originalRecipe = await Recipe.findById(recipeId);
    
    if (originalRecipe) {
      // Store original data for comparison after update
      req.originalRecipeData = originalRecipe.toObject();
    }
  } catch (error) {
    console.error('Error capturing original recipe data:', error);
  }
  
  next();
};

/**
 * Middleware to log the actual update after it happens
 */
const logUpdateResult = async (req, res, next) => {
  try {
    if (!req.user || req.method !== 'PUT' || !req.originalRecipeData) {
      return next();
    }

    const recipeId = req.params.id;
    const changes = getChanges(req.originalRecipeData, req.body);
    
    if (changes) {
      await ChangeLog.create({
        user: req.user.userId || req.user._id,
        username: req.user.username,
        recipe: recipeId,
        recipeName: req.originalRecipeData.name,
        action: 'updated',
        changes: changes,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
  } catch (error) {
    console.error('Error logging recipe update:', error);
  }
  
  next();
};

module.exports = {
  logRecipeChange,
  logRecipeView,
  captureChanges,
  logRecipeUpdate,
  logUpdateResult,
  getChanges
};
