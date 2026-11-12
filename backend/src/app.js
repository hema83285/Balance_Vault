const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const ENV = require('./config/env');
const requestIdMiddleware = require('./middleware/requestId.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const { generalRateLimiter } = require('./middleware/rateLimiter.middleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const accountRoutes = require('./routes/account.routes');
const transferRoutes = require('./routes/transfer.routes');
const ledgerRoutes = require('./routes/ledger.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman) or matching frontend
      if (!origin || origin.startsWith('http://localhost') || origin === ENV.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for challenge testing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id']
  })
);

// Body parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request ID tracing
app.use(requestIdMiddleware);

// General rate limiter
app.use('/api', generalRateLimiter);

// Health & Readiness probes
app.use('/', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    requestId: req.id
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
