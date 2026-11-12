const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { isRedisAvailable } = require('../config/redis');

// Liveness probe
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness probe
router.get('/ready', async (req, res) => {
  const dependencies = {
    database: 'unknown',
    redis: isRedisAvailable() ? 'connected' : 'in-memory-fallback'
  };

  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    dependencies.database = 'connected';

    res.status(200).json({
      status: 'ready',
      dependencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    dependencies.database = 'disconnected';
    res.status(503).json({
      status: 'unready',
      dependencies,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
