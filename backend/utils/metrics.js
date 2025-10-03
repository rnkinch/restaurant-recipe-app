const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for your application
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

const recipesTotal = new client.Gauge({
  name: 'recipes_total',
  help: 'Total number of recipes'
});

const ingredientsTotal = new client.Gauge({
  name: 'ingredients_total',
  help: 'Total number of ingredients'
});

const purveyorsTotal = new client.Gauge({
  name: 'purveyors_total',
  help: 'Total number of purveyors'
});

const databaseConnections = new client.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

const fileUploadsTotal = new client.Counter({
  name: 'file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['type']
});

const authenticationAttempts = new client.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['result'] // success, failure
});

const bulkUploadOperations = new client.Counter({
  name: 'bulk_upload_operations_total',
  help: 'Total number of bulk upload operations',
  labelNames: ['status'] // success, failed, partial
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeUsers);
register.registerMetric(recipesTotal);
register.registerMetric(ingredientsTotal);
register.registerMetric(purveyorsTotal);
register.registerMetric(databaseConnections);
register.registerMetric(fileUploadsTotal);
register.registerMetric(authenticationAttempts);
register.registerMetric(bulkUploadOperations);

// Helper functions
const recordHttpRequest = (req, res, duration) => {
  const route = req.route ? req.route.path : req.path;
  const labels = {
    method: req.method,
    route: route,
    status_code: res.statusCode
  };
  
  httpRequestDuration.observe(labels, duration / 1000);
  httpRequestTotal.inc(labels);
};

const recordFileUpload = (type) => {
  fileUploadsTotal.inc({ type });
};

const recordAuthenticationAttempt = (success) => {
  authenticationAttempts.inc({ result: success ? 'success' : 'failure' });
};

const recordBulkUpload = (status) => {
  bulkUploadOperations.inc({ status });
};

// Update database metrics
const updateDatabaseMetrics = async () => {
  try {
    const mongoose = require('mongoose');
    const Recipe = require('../models/Recipe');
    const Ingredient = require('../models/Ingredient');
    const Purveyor = require('../models/Purveyor');
    const User = require('../models/User');
    
    const [recipeCount, ingredientCount, purveyorCount, activeUserCount] = await Promise.all([
      Recipe.countDocuments(),
      Ingredient.countDocuments(),
      Purveyor.countDocuments(),
      User.countDocuments({ isActive: true })
    ]);
    
    recipesTotal.set(recipeCount);
    ingredientsTotal.set(ingredientCount);
    purveyorsTotal.set(purveyorCount);
    activeUsers.set(activeUserCount);
    
    // Database connection count
    const connectionState = mongoose.connection.readyState;
    databaseConnections.set(connectionState === 1 ? 1 : 0);
    
  } catch (error) {
    console.error('Error updating database metrics:', error);
  }
};

// Update metrics every 30 seconds
setInterval(updateDatabaseMetrics, 30000);

module.exports = {
  register,
  recordHttpRequest,
  recordFileUpload,
  recordAuthenticationAttempt,
  recordBulkUpload,
  updateDatabaseMetrics
};
