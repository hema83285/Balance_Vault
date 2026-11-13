require('dotenv').config();

const ENV = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5175',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/balancevault?schema=balancevault_app',
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'balancevault_super_secure_jwt_secret_key_2026_snovasys',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@balancevault.internal',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'AdminSecure#2026',
  SEED_ADMIN_FIRSTNAME: process.env.SEED_ADMIN_FIRSTNAME || 'Platform',
  SEED_ADMIN_LASTNAME: process.env.SEED_ADMIN_LASTNAME || 'Admin'
};

module.exports = ENV;
