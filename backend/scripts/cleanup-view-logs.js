const mongoose = require('mongoose');
const ChangeLog = require('../models/ChangeLog');
require('dotenv').config();

async function cleanupViewLogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-recipe-app');
    console.log('Connected to MongoDB');

    // Delete all "viewed" action entries
    const result = await ChangeLog.deleteMany({ action: 'viewed' });
    
    console.log(`Successfully removed ${result.deletedCount} "viewed" entries from change log`);
    
    // Show remaining action counts
    const actionCounts = await ChangeLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nRemaining action counts:');
    actionCounts.forEach(action => {
      console.log(`  ${action._id}: ${action.count}`);
    });
    
  } catch (error) {
    console.error('Error cleaning up view logs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupViewLogs();
