const mongoose = require('mongoose');

const ChangeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  recipeName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'viewed', 'image_uploaded', 'image_removed']
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries and cleanup
ChangeLogSchema.index({ timestamp: 1 });
ChangeLogSchema.index({ user: 1, timestamp: -1 });
ChangeLogSchema.index({ recipe: 1, timestamp: -1 });

// Static method to clean up old logs (older than 14 days)
ChangeLogSchema.statics.cleanupOldLogs = async function() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const result = await this.deleteMany({
    timestamp: { $lt: fourteenDaysAgo }
  });
  
  console.log(`Cleaned up ${result.deletedCount} change log entries older than 14 days`);
  return result;
};

// Static method to get logs for a specific user
ChangeLogSchema.statics.getUserLogs = async function(userId, limit = 50) {
  return await this.find({ user: userId })
    .populate('recipe', 'name')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get logs for a specific recipe
ChangeLogSchema.statics.getRecipeLogs = async function(recipeId, limit = 50) {
  return await this.find({ recipe: recipeId })
    .populate('user', 'username')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get recent logs
ChangeLogSchema.statics.getRecentLogs = async function(limit = 100) {
  return await this.find()
    .populate('user', 'username')
    .populate('recipe', 'name')
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = mongoose.model('ChangeLog', ChangeLogSchema);
