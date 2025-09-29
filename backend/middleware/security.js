const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

// File upload rate limiting
const uploadLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 uploads per windowMs
  'Too many file uploads, please try again later.'
);

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  // Additional security headers for production
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Input sanitization middleware
const sanitizeInput = [
  // Sanitize data against XSS attacks
  xss(),
  
  // Prevent parameter pollution
  hpp()
];

// Custom NoSQL injection protection
const noSqlInjectionProtection = (req, res, next) => {
  // Remove $ and . from request body to prevent NoSQL injection
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove keys that start with $ or contain .
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// File upload security validation
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Check file size (already handled by multer, but double-check)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ error: 'File too large' });
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({ error: 'Invalid file extension' });
  }

  next();
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: duration + 'ms'
    };
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.warn('Security Alert:', JSON.stringify(logData));
    } else {
      console.log('Request:', JSON.stringify(logData));
    }
  });
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  securityHeaders,
  sanitizeInput,
  noSqlInjectionProtection,
  validateFileUpload,
  securityLogger
};
