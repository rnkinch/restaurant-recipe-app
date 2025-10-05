// validation.js - Backend validation middleware
const mongoose = require('mongoose');

// Validation rules
const VALIDATION_RULES = {
  recipe: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-'&.,()]+$/,
      message: 'Recipe name must be 2-100 characters, letters, numbers, spaces, and basic punctuation only'
    },
    steps: {
      required: true,
      minLength: 10,
      maxLength: 2000,
      message: 'Preparation steps must be 10-2000 characters'
    },
    platingGuide: {
      required: true,
      minLength: 5,
      maxLength: 1000,
      message: 'Plating guide must be 5-1000 characters'
    },
    ingredients: {
      minCount: 1,
      maxCount: 50,
      message: 'Recipe must have 1-50 ingredients'
    },
    ingredient: {
      quantity: {
        required: true,
        pattern: /^(\d+|\d+\.\d+|1\/2|1\/3|1\/4|2\/3|3\/4|\d+\s+\d+\/\d+|\d+\/\d+)$/,
        message: 'Quantity must be a valid number, decimal, or fraction (e.g., 1, 1.5, 1/2, 2 1/3)'
      },
      measure: {
        required: true,
        pattern: /^[a-zA-Z\s\/\-]+$/,
        message: 'Measure must contain letters, spaces, slashes, and hyphens'
      }
    }
  },
  ingredient: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9\s\-'&.,()]+$/,
      message: 'Ingredient name must be 2-50 characters, letters, numbers, spaces, and basic punctuation only'
    },
    purveyor: {
      required: true,
      message: 'Purveyor is required'
    }
  },
  purveyor: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9\s\-'&.,()]+$/,
      message: 'Purveyor name must be 2-50 characters, letters, numbers, spaces, and basic punctuation only'
    }
  }
};

// Helper function to validate a field
const validateField = (value, rules) => {
  const errors = [];
  
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push('This field is required');
    return errors;
  }
  
  if (value && rules.minLength && value.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters`);
  }
  
  if (value && rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Must be no more than ${rules.maxLength} characters`);
  }
  
  if (value && rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.message || 'Invalid format');
  }
  
  return errors;
};

// Sanitize input to prevent XSS and other attacks
const sanitizeInput = (input, preserveLineBreaks = false) => {
  if (typeof input !== 'string') return input;
  
  let sanitized = input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
  
  if (preserveLineBreaks) {
    // Preserve ALL formatting exactly as typed - no changes to whitespace
    // Only remove potential security threats
    sanitized = sanitized; // Keep exactly as is
  } else {
    // Normal sanitization for other fields
    sanitized = sanitized
      .trim()
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  }
  
  return sanitized;
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Preserve line breaks for steps and platingGuide fields
      const preserveLineBreaks = key === 'steps' || key === 'platingGuide';
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value, preserveLineBreaks);
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  return obj;
};

// Validate recipe data
const validateRecipeData = (recipeData) => {
  const errors = {};
  
  // Validate name
  const nameErrors = validateField(recipeData.name, VALIDATION_RULES.recipe.name);
  if (nameErrors.length > 0) {
    errors.name = nameErrors[0];
  }
  
  // Validate steps
  const stepsErrors = validateField(recipeData.steps, VALIDATION_RULES.recipe.steps);
  if (stepsErrors.length > 0) {
    errors.steps = stepsErrors[0];
  }
  
  // Validate plating guide
  const platingErrors = validateField(recipeData.platingGuide, VALIDATION_RULES.recipe.platingGuide);
  if (platingErrors.length > 0) {
    errors.platingGuide = platingErrors[0];
  }
  
  // Validate ingredients
  if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients)) {
    errors.ingredients = 'Ingredients must be an array';
  } else if (recipeData.ingredients.length === 0) {
    errors.ingredients = 'Recipe must have at least one ingredient';
  } else if (recipeData.ingredients.length > VALIDATION_RULES.recipe.ingredients.maxCount) {
    errors.ingredients = `Recipe cannot have more than ${VALIDATION_RULES.recipe.ingredients.maxCount} ingredients`;
  } else {
    // Validate each ingredient
    const ingredientErrors = [];
    recipeData.ingredients.forEach((ingredient, index) => {
      const ingErrors = {};
      
      // Validate ingredient ID
      if (!ingredient.ingredient || !mongoose.Types.ObjectId.isValid(ingredient.ingredient)) {
        ingErrors.ingredient = 'Valid ingredient ID is required';
      }
      
      // Validate quantity
      const quantityErrors = validateField(ingredient.quantity, VALIDATION_RULES.recipe.ingredient.quantity);
      if (quantityErrors.length > 0) {
        ingErrors.quantity = quantityErrors[0];
      }
      
      // Validate measure
      const measureErrors = validateField(ingredient.measure, VALIDATION_RULES.recipe.ingredient.measure);
      if (measureErrors.length > 0) {
        ingErrors.measure = measureErrors[0];
      }
      
      if (Object.keys(ingErrors).length > 0) {
        ingredientErrors[index] = ingErrors;
      }
    });
    
    if (ingredientErrors.length > 0) {
      errors.ingredients = ingredientErrors;
    }
  }
  
  // Validate allergens (optional array)
  if (recipeData.allergens && !Array.isArray(recipeData.allergens)) {
    errors.allergens = 'Allergens must be an array';
  }
  
  // Validate service types (optional array)
  if (recipeData.serviceTypes && !Array.isArray(recipeData.serviceTypes)) {
    errors.serviceTypes = 'Service types must be an array';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate ingredient data
const validateIngredientData = (ingredientData) => {
  const errors = {};
  
  const nameErrors = validateField(ingredientData.name, VALIDATION_RULES.ingredient.name);
  if (nameErrors.length > 0) {
    errors.name = nameErrors[0];
  }
  
  if (!ingredientData.purveyor || !mongoose.Types.ObjectId.isValid(ingredientData.purveyor)) {
    errors.purveyor = 'Valid purveyor ID is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate purveyor data
const validatePurveyorData = (purveyorData) => {
  const errors = {};
  
  const nameErrors = validateField(purveyorData.name, VALIDATION_RULES.purveyor.name);
  if (nameErrors.length > 0) {
    errors.name = nameErrors[0];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Middleware for recipe validation
const validateRecipe = (req, res, next) => {
  try {
    // Parse ingredients if it's a string BEFORE sanitizing
    if (req.body.ingredients && typeof req.body.ingredients === 'string') {
      try {
        req.body.ingredients = JSON.parse(req.body.ingredients);
      } catch (e) {
        console.error('Error parsing ingredients:', e);
        return res.status(400).json({ 
          error: 'Invalid ingredients format',
          details: 'Ingredients must be valid JSON'
        });
      }
    }
    
    // Parse allergens and serviceTypes if they're strings
    if (req.body.allergens && typeof req.body.allergens === 'string') {
      try {
        req.body.allergens = JSON.parse(req.body.allergens);
      } catch (e) {
        console.error('Error parsing allergens:', e);
        return res.status(400).json({ 
          error: 'Invalid allergens format',
          details: 'Allergens must be valid JSON'
        });
      }
    }
    
    if (req.body.serviceTypes && typeof req.body.serviceTypes === 'string') {
      try {
        req.body.serviceTypes = JSON.parse(req.body.serviceTypes);
      } catch (e) {
        console.error('Error parsing service types:', e);
        return res.status(400).json({ 
          error: 'Invalid service types format',
          details: 'Service types must be valid JSON'
        });
      }
    }
    
    // NOW sanitize the request body after parsing JSON fields
    req.body = sanitizeObject(req.body);
    
    // Validate the recipe data
    const validation = validateRecipeData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }
    next();
  } catch (err) {
    console.error('=== VALIDATION ERROR ===');
    console.error('Recipe validation error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Validation error occurred' });
  }
};

// Middleware for ingredient validation
const validateIngredient = (req, res, next) => {
  try {
    // Sanitize the request body
    req.body = sanitizeObject(req.body);
    
    // Validate the ingredient data
    const validation = validateIngredientData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    next();
  } catch (err) {
    console.error('Ingredient validation error:', err);
    res.status(500).json({ error: 'Validation error occurred' });
  }
};

// Middleware for purveyor validation
const validatePurveyor = (req, res, next) => {
  try {
    // Sanitize the request body
    req.body = sanitizeObject(req.body);
    
    // Validate the purveyor data
    const validation = validatePurveyorData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    next();
  } catch (err) {
    console.error('Purveyor validation error:', err);
    res.status(500).json({ error: 'Validation error occurred' });
  }
};

// General input sanitization middleware
const sanitizeInputs = (req, res, next) => {
  try {
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
  } catch (err) {
    console.error('Input sanitization error:', err);
    res.status(500).json({ error: 'Input sanitization error occurred' });
  }
};

module.exports = {
  validateRecipe,
  validateIngredient,
  validatePurveyor,
  sanitizeInputs,
  sanitizeInput,
  sanitizeObject,
  validateRecipeData,
  validateIngredientData,
  validatePurveyorData
};
