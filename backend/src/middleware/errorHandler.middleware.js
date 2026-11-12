const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled application error', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    requestId: req.id
  });

  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message);

  return errorResponse(res, message, statusCode);
}

module.exports = errorHandler;
