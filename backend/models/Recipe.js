const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  name: String,
  description: String,
  ingredients: [
    {
      name: String,
      quantity: String,
      unit: String,
    },
  ],
  steps: [String],
  photoPath: String,
  platingGuide: String,
  allergens: [String],
  serviceTypes: [String],

  // optional per-recipe PDF template
  pdfTemplate: {
    type: Object,
    required: false,
  },
});

// Avoid OverwriteModelError by reusing the model if it exists
module.exports = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
