const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Ingredient name is required'],
    trim: true,
    minlength: [2, 'Ingredient name must be at least 2 characters'],
    maxlength: [50, 'Ingredient name cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9\s\-'&.,()]+$/, 'Ingredient name contains invalid characters'],
    unique: true
  },
  purveyor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Purveyor', 
    required: [true, 'Purveyor reference is required']
  },
  active: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for better performance
IngredientSchema.index({ name: 'text' });
IngredientSchema.index({ purveyor: 1 });
IngredientSchema.index({ active: 1 });

// Avoid OverwriteModelError by reusing the model if it exists
module.exports = mongoose.models.Ingredient || mongoose.model('Ingredient', IngredientSchema);
