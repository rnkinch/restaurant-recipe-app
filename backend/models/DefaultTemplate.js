const mongoose = require('mongoose');

const DefaultTemplateSchema = new mongoose.Schema({
  name: { type: String, default: 'recipe-default' },
  template: { type: Object, required: true },
});

// Avoid OverwriteModelError by reusing the model if it exists
module.exports = mongoose.models.DefaultTemplate || mongoose.model('DefaultTemplate', DefaultTemplateSchema);
