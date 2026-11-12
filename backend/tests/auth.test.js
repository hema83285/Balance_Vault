require('./setup');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-1' })
  }
}));

describe('Authentication & Identification APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => Promise.resolve({
        id: 'user-uuid-1',
        email: data.email,
        role: 'ACCOUNT_HOLDER',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        createdAt: new Date()
      }));

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'johndoe@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+91 9999999999'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('johndoe@example.com');
      expect(res.body.data.user.role).toBe('ACCOUNT_HOLDER');
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'johndoe@example.com'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'johndoe@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration if password does not meet complexity requirements', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'weak',
          firstName: 'Weak',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user and return token with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword1', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash,
        role: 'ACCOUNT_HOLDER',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: null,
        createdAt: new Date()
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'CorrectPassword1'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('user@example.com');
    });

    it('should reject login with invalid password', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword1', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword1'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword1'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
