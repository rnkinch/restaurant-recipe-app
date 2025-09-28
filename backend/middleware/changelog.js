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
 * Middleware to capture changes in request body for updates
 */
const captureChanges = (req, res, next) => {
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      req.originalBody = JSON.parse(JSON.stringify(req.body));
    } catch (error) {
      console.error('Error capturing changes:', error);
      // If we can't capture changes, just continue without them
      req.originalBody = null;
    }
  }
  next();
};

/**
 * Helper function to get changes between old and new data
 */
const getChanges = (oldData, newData) => {
  const changes = {};
  
  // Helper function to deeply compare values
  const isEqual = (a, b) => {
    // Handle null/undefined
    if (a === null || a === undefined) return b === null || b === undefined;
    if (b === null || b === undefined) return a === null || a === undefined;
    
    // Handle primitive types
    if (typeof a !== typeof b) {
      // Try to convert strings to numbers for comparison
      if (typeof a === 'string' && typeof b === 'number') {
        return parseFloat(a) === b;
      }
      if (typeof a === 'number' && typeof b === 'string') {
        return a === parseFloat(b);
      }
      // Try to convert strings to booleans
      if (typeof a === 'string' && typeof b === 'boolean') {
        return (a.toLowerCase() === 'true') === b;
      }
      if (typeof a === 'boolean' && typeof b === 'string') {
        return a === (b.toLowerCase() === 'true');
      }
      return false;
    }
    
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => isEqual(item, b[index]));
    }
    
    // Handle objects
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => isEqual(a[key], b[key]));
    }
    
    // Handle strings (normalize whitespace)
    if (typeof a === 'string' && typeof b === 'string') {
      return a.trim() === b.trim();
    }
    
    // Default comparison
    return a === b;
  };
  
  for (const key in newData) {
    const oldValue = oldData[key];
    const newValue = newData[key];
    
    // Skip if values are actually equal
    if (isEqual(oldValue, newValue)) {
      continue;
    }
    
    // Only log if there's a meaningful change
    changes[key] = {
      from: oldValue,
      to: newValue
    };
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
    
    // Get the processed recipe data from the response
    // This should be set by the route handler after processing
    const processedData = req.processedRecipeData || req.body;
    const changes = getChanges(req.originalRecipeData, processedData);
    
    if (changes) {
      // Resolve ingredient names for better change log readability
      const resolvedChanges = await resolveIngredientNames(changes);
      
      await ChangeLog.create({
        user: req.user.userId || req.user._id,
        username: req.user.username,
        recipe: recipeId,
        recipeName: req.originalRecipeData.name,
        action: 'updated',
        changes: resolvedChanges,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
  } catch (error) {
    console.error('Error logging recipe update:', error);
    // Don't fail the request if logging fails
  }
  
  next();
};

/**
 * Helper function to resolve ingredient ObjectIds to names
 */
const resolveIngredientNames = async (changes) => {
  try {
    // Only process if there are ingredient changes
    if (!changes.ingredients) {
      return changes;
    }

    // Get the Ingredient model
    const mongoose = require('mongoose');
    const Ingredient = mongoose.model('Ingredient');
    
    // Collect all ingredient IDs
    const ingredientIds = new Set();
    
    // From the 'from' data
    if (changes.ingredients.from && Array.isArray(changes.ingredients.from)) {
      changes.ingredients.from.forEach(ing => {
        if (ing.ingredient && typeof ing.ingredient === 'string') {
          ingredientIds.add(ing.ingredient);
        }
      });
    }
    
    // From the 'to' data
    if (changes.ingredients.to && Array.isArray(changes.ingredients.to)) {
      changes.ingredients.to.forEach(ing => {
        if (ing.ingredient && typeof ing.ingredient === 'string') {
          ingredientIds.add(ing.ingredient);
        }
      });
    }
    
    // Fetch ingredient names
    const ingredients = await Ingredient.find({ _id: { $in: Array.from(ingredientIds) } });
    const ingredientMap = {};
    ingredients.forEach(ing => {
      ingredientMap[ing._id.toString()] = ing.name;
    });
    
    // Create resolved changes
    const resolvedChanges = { ...changes };
    
    if (changes.ingredients.from && Array.isArray(changes.ingredients.from)) {
      resolvedChanges.ingredients.from = changes.ingredients.from.map(ing => ({
        ...ing,
        ingredient: ingredientMap[ing.ingredient] || ing.ingredient
      }));
    }
    
    if (changes.ingredients.to && Array.isArray(changes.ingredients.to)) {
      resolvedChanges.ingredients.to = changes.ingredients.to.map(ing => ({
        ...ing,
        ingredient: ingredientMap[ing.ingredient] || ing.ingredient
      }));
    }
    
    return resolvedChanges;
  } catch (error) {
    console.error('Error resolving ingredient names:', error);
    return changes; // Return original changes if resolution fails
  }
};

module.exports = {
  logRecipeChange,
  captureChanges,
  logRecipeUpdate,
  logUpdateResult,
  getChanges
};
