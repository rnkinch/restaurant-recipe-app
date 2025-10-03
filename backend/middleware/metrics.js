const { recordHttpRequest } = require('../utils/metrics');

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    recordHttpRequest(req, res, duration);
  });
  
  next();
};

module.exports = { metricsMiddleware };
