#!/usr/bin/env node

/**
 * Standalone script to clean up old change logs
 * This can be run as a cron job or scheduled task
 */

const mongoose = require('mongoose');
const ChangeLog = require('../models/ChangeLog');
require('dotenv').config();

const cleanupChangeLogs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant-recipe-app');
    console.log('Connected to MongoDB');

    // Clean up logs older than 14 days
    const result = await ChangeLog.cleanupOldLogs();
    
    console.log(`✅ Cleanup completed successfully`);
    console.log(`📊 Deleted ${result.deletedCount} old change log entries`);
    
    // Get current log count
    const totalLogs = await ChangeLog.countDocuments();
    console.log(`📈 Total change logs remaining: ${totalLogs}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupChangeLogs();
}

module.exports = cleanupChangeLogs;
