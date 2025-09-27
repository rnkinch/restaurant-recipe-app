const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch current user data to check if still active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User account is inactive or deleted' });
    }
    
    req.user = {
      userId: user._id,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    };
    
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin']);

// User or Admin middleware
const requireUser = requireRole(['user', 'admin']);

// Read-only access middleware (for viewing only)
const requireReadOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Allow read-only access for all authenticated users
  next();
};

// Edit permission middleware (for creating/updating/deleting)
const requireEditPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Only allow editing for active users with user or admin role (exclude readonly)
  if (!req.user.isActive || req.user.role === 'readonly') {
    return res.status(403).json({ 
      error: 'Edit permission denied. Read-only users cannot modify data.' 
    });
  }
  
  // Allow editing for user and admin roles
  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Edit permission denied. Contact administrator for access.' 
    });
  }
  
  next();
};

module.exports = {
  User,
  authenticateToken,
  requireAdmin,
  requireUser,
  requireRole,
  requireReadOnly,
  requireEditPermission
};
