const Redis = require('ioredis');
const ENV = require('./env');

let redisClient = null;
let isRedisConnected = false;

if (ENV.REDIS_URL && ENV.REDIS_URL.trim() !== '') {
  try {
    redisClient = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('✅ Connected to Redis successfully');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      // Graceful fallback - log only once or quietly
      console.warn('⚠️ Redis unavailable, falling back to in-memory rate limiting:', err.message);
    });

    // Attempt non-blocking connection
    redisClient.connect().catch(() => {
      isRedisConnected = false;
    });
  } catch (error) {
    console.warn('⚠️ Could not initialize Redis client, using in-memory store:', error.message);
  }
} else {
  console.log('ℹ️ No REDIS_URL provided. Using resilient in-memory store.');
}

module.exports = {
  getRedisClient: () => (isRedisConnected ? redisClient : null),
  isRedisAvailable: () => isRedisConnected
};
