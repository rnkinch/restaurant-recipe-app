const mongoose = require('mongoose');

const DefaultTemplateSchema = new mongoose.Schema({
  name: { type: String, default: 'recipe-default', unique: true },
  displayName: { type: String },
  category: { type: String, default: 'custom' },
  template: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
DefaultTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Avoid OverwriteModelError by reusing the model if it exists
module.exports = mongoose.models.DefaultTemplate || mongoose.model('DefaultTemplate', DefaultTemplateSchema);
