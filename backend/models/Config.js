const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  appName: { type: String, default: "Darby's Recipe and Plating Guide", trim: true },
  showLeftNav: { type: Boolean, default: true }
}, { collection: 'config' });

// Static method to find or create the single config document
ConfigSchema.statics.findOrCreate = async function() {
  let config = await this.findOne();
  if (!config) {
    config = new this({ appName: "Darby's Recipe and Plating Guide", showLeftNav: true });
    await config.save();
  }
  return config;
};

module.exports = mongoose.models.Config || mongoose.model('Config', ConfigSchema);
