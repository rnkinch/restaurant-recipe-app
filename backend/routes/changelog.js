const express = require('express');
const router = express.Router();
const ChangeLog = require('../models/ChangeLog');
const { authenticateToken, requireAdmin, requireReadOnly } = require('../middleware/auth');

/**
 * GET /api/changelog
 * Get recent change logs (all authenticated users)
 */
router.get('/', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const { limit = 50, page = 1, user, recipe, action, days = 14 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Build query
    const query = {
      timestamp: { $gte: startDate, $lte: endDate }
    };
    
    if (user) {
      query.user = user;
    }
    
    if (recipe) {
      query.recipe = recipe;
    }
    
    if (action) {
      query.action = action;
    }
    
    // Get logs with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await ChangeLog.find(query)
      .populate('user', 'username')
      .populate('recipe', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Debug logging
    console.log('Retrieved change logs:', JSON.stringify(logs, null, 2));
    
    const total = await ChangeLog.countDocuments(query);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching change logs:', error);
    res.status(500).json({ error: 'Failed to fetch change logs' });
  }
});

/**
 * GET /api/changelog/user/:userId
 * Get change logs for a specific user
 */
router.get('/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, days = 14 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const logs = await ChangeLog.find({
      user: userId,
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('recipe', 'name')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching user change logs:', error);
    res.status(500).json({ error: 'Failed to fetch user change logs' });
  }
});

/**
 * GET /api/changelog/recipe/:recipeId
 * Get change logs for a specific recipe (all authenticated users)
 */
router.get('/recipe/:recipeId', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { limit = 50, days = 14 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const logs = await ChangeLog.find({
      recipe: recipeId,
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('user', 'username')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching recipe change logs:', error);
    res.status(500).json({ error: 'Failed to fetch recipe change logs' });
  }
});

/**
 * GET /api/changelog/my-logs
 * Get current user's change logs (all authenticated users)
 */
router.get('/my-logs', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const { limit = 50, days = 14 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const logs = await ChangeLog.find({
      user: req.user.userId || req.user._id,
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('recipe', 'name')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching user change logs:', error);
    res.status(500).json({ error: 'Failed to fetch change logs' });
  }
});

/**
 * GET /api/changelog/stats
 * Get change log statistics (admin only)
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 14 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get action counts
    const actionStats = await ChangeLog.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get user activity
    const userStats = await ChangeLog.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get total logs
    const totalLogs = await ChangeLog.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    res.json({
      totalLogs,
      actionStats,
      userStats,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching change log stats:', error);
    res.status(500).json({ error: 'Failed to fetch change log statistics' });
  }
});

/**
 * DELETE /api/changelog/cleanup
 * Manually trigger cleanup of old logs (admin only)
 */
router.delete('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await ChangeLog.cleanupOldLogs();
    res.json({ 
      message: `Cleaned up ${result.deletedCount} old change log entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up change logs:', error);
    res.status(500).json({ error: 'Failed to cleanup change logs' });
  }
});

/**
 * GET /api/changelog/export
 * Export change logs to CSV (all authenticated users)
 */
router.get('/export', authenticateToken, requireReadOnly, async (req, res) => {
  try {
    const { days = 14, format = 'csv' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const logs = await ChangeLog.find({
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('user', 'username')
    .populate('recipe', 'name')
    .sort({ timestamp: -1 });
    
    if (format === 'csv') {
      // Generate CSV
      let csv = 'Timestamp,User,Recipe,Action,IP Address,User Agent\n';
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.username}","${log.recipeName}","${log.action}","${log.ipAddress || ''}","${log.userAgent || ''}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="changelog-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.json({ logs });
    }
  } catch (error) {
    console.error('Error exporting change logs:', error);
    res.status(500).json({ error: 'Failed to export change logs' });
  }
});

module.exports = router;
