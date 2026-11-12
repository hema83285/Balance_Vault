const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient, isRedisAvailable } = require('../config/redis');

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) {
  const options = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED'
    }
  };

  const redis = getRedisClient();
  if (isRedisAvailable() && redis) {
    try {
      options.store = new RedisStore({
        sendCommand: (...args) => redis.call(...args)
      });
    } catch (e) {
      // Fallback to in-memory
    }
  }

  return rateLimit(options);
}

// Strict limiter for authentication (brute force protection): 10 requests per 15 minutes
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
});

// Transfer limiter: 30 requests per minute
const transferRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Transfer rate limit exceeded. Please wait before submitting another transfer.'
});

// General API limiter: 300 requests per 15 minutes
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300
});

module.exports = {
  authRateLimiter,
  transferRateLimiter,
  generalRateLimiter
};
