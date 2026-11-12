const { PrismaClient } = require('@prisma/client');

// Allow BigInt to be serialized to JSON safely
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

module.exports = prisma;
