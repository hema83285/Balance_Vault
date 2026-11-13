const app = require('./src/app');
const ENV = require('./src/config/env');
const prisma = require('./src/config/db');

const PORT = ENV.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🏦 BalanceVault Financial API Server Running`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🔒 Environment: ${ENV.NODE_ENV}`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('✅ PostgreSQL disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
