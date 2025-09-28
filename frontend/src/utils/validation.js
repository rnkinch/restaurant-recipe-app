// validation.js - Comprehensive validation utilities
export const VALIDATION_RULES = {
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

export const validateField = (value, rules) => {
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

export const validateRecipe = (formData) => {
  const errors = {};
  
  // Validate name
  const nameErrors = validateField(formData.name, VALIDATION_RULES.recipe.name);
  if (nameErrors.length > 0) {
    errors.name = nameErrors[0];
  }
  
  // Validate steps
  const stepsErrors = validateField(formData.steps, VALIDATION_RULES.recipe.steps);
  if (stepsErrors.length > 0) {
    errors.steps = stepsErrors[0];
  }
  
  // Validate plating guide
  const platingErrors = validateField(formData.platingGuide, VALIDATION_RULES.recipe.platingGuide);
  if (platingErrors.length > 0) {
    errors.platingGuide = platingErrors[0];
  }
  
  // Validate ingredients
  if (!formData.ingredients || formData.ingredients.length === 0) {
    errors.ingredients = 'Recipe must have at least one ingredient';
  } else if (formData.ingredients.length > VALIDATION_RULES.recipe.ingredients.maxCount) {
    errors.ingredients = `Recipe cannot have more than ${VALIDATION_RULES.recipe.ingredients.maxCount} ingredients`;
  } else {
    // Validate each ingredient
    const ingredientErrors = [];
    formData.ingredients.forEach((ingredient, index) => {
      const ingErrors = {};
      
      if (!ingredient.ingredient) {
        ingErrors.ingredient = 'Please select an ingredient';
      }
      
      const quantityErrors = validateField(ingredient.quantity, VALIDATION_RULES.recipe.ingredient.quantity);
      if (quantityErrors.length > 0) {
        ingErrors.quantity = quantityErrors[0];
      }
      
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
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateIngredient = (ingredientData) => {
  const errors = {};
  
  const nameErrors = validateField(ingredientData.name, VALIDATION_RULES.ingredient.name);
  if (nameErrors.length > 0) {
    errors.name = nameErrors[0];
  }
  
  if (!ingredientData.purveyor) {
    errors.purveyor = 'Please select a purveyor';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

export const validateFileUpload = (file) => {
  const errors = [];
  
  if (!file) return { isValid: true, errors: [] };
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPEG and PNG images are allowed');
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push('File must have .jpg, .jpeg, or .png extension');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
