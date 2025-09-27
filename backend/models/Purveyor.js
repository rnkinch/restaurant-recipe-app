const mongoose = require('mongoose');

const PurveyorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Purveyor name is required'],
    trim: true,
    minlength: [2, 'Purveyor name must be at least 2 characters'],
    maxlength: [50, 'Purveyor name cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9\s\-'&.,()]+$/, 'Purveyor name contains invalid characters'],
    unique: true
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    }
  },
  active: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for better performance
PurveyorSchema.index({ name: 'text' });
PurveyorSchema.index({ active: 1 });

// Avoid OverwriteModelError by reusing the model if it exists
module.exports = mongoose.models.Purveyor || mongoose.model('Purveyor', PurveyorSchema);
