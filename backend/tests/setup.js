// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
process.env.REDIS_URL = ''; // disable redis during tests

// Handle BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString();
};
