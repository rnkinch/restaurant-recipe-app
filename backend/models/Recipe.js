const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Recipe name is required'],
    trim: true,
    minlength: [2, 'Recipe name must be at least 2 characters'],
    maxlength: [100, 'Recipe name cannot exceed 100 characters'],
    match: [/^[a-zA-Z0-9\s\-'&.,()]+$/, 'Recipe name contains invalid characters']
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  ingredients: [{
    ingredient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ingredient', 
      required: [true, 'Ingredient reference is required']
    },
    quantity: { 
      type: String, 
      required: [true, 'Quantity is required'],
      trim: true,
      match: [/^(\d+|\d+\.\d+|1\/2|1\/3|1\/4|2\/3|3\/4|\d+\s+\d+\/\d+|\d+\/\d+)$/, 'Quantity must be a valid number, decimal, or fraction']
    },
    measure: { 
      type: String, 
      required: [true, 'Measure is required'],
      trim: true,
      match: [/^[a-zA-Z\s\/\-]+$/, 'Measure must contain letters, spaces, slashes, and hyphens']
    }
  }],
  steps: { 
    type: String, 
    required: [true, 'Preparation steps are required'],
    minlength: [10, 'Preparation steps must be at least 10 characters'],
    maxlength: [2000, 'Preparation steps cannot exceed 2000 characters']
  },
  platingGuide: { 
    type: String, 
    required: [true, 'Plating guide is required'],
    minlength: [5, 'Plating guide must be at least 5 characters'],
    maxlength: [1000, 'Plating guide cannot exceed 1000 characters']
  },
  allergens: [{
    type: String,
    trim: true,
    maxlength: [50, 'Allergen name cannot exceed 50 characters']
  }],
  serviceTypes: [{
    type: String,
    trim: true,
    maxlength: [50, 'Service type cannot exceed 50 characters']
  }],
  image: { 
    type: String,
    trim: true
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  // optional per-recipe PDF template
  pdfTemplate: {
    type: Object,
    required: false,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add validation for ingredients array length
RecipeSchema.pre('validate', function(next) {
  if (this.ingredients && this.ingredients.length === 0) {
    this.invalidate('ingredients', 'Recipe must have at least one ingredient');
  }
  if (this.ingredients && this.ingredients.length > 50) {
    this.invalidate('ingredients', 'Recipe cannot have more than 50 ingredients');
  }
  next();
});

// Add indexes for better performance
RecipeSchema.index({ name: 'text', steps: 'text', platingGuide: 'text' });
RecipeSchema.index({ active: 1 });
RecipeSchema.index({ 'ingredients.ingredient': 1 });

// Avoid OverwriteModelError by reusing the model if it exists
module.exports = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
