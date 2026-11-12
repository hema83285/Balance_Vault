require('./setup');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/config/db');
const ENV = require('../src/config/env');

jest.mock('../src/config/db', () => ({
  user: {
    findUnique: jest.fn()
  },
  account: {
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(10)
  },
  onboarding: {
    count: jest.fn().mockResolvedValue(2)
  },
  transaction: {
    count: jest.fn().mockResolvedValue(5),
    findMany: jest.fn().mockResolvedValue([])
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    findMany: jest.fn().mockResolvedValue([])
  }
}));

describe('Role-Based Access Control (RBAC) Security Enforcement', () => {
  const userToken = jwt.sign(
    { userId: 'user-regular-id', role: 'ACCOUNT_HOLDER', email: 'user@example.com' },
    ENV.JWT_SECRET
  );

  const adminToken = jwt.sign(
    { userId: 'admin-super-id', role: 'ADMIN', email: 'admin@balancevault.internal' },
    ENV.JWT_SECRET
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Endpoint Protection', () => {
    it('should reject unauthenticated request to /api/admin/dashboard with 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject ACCOUNT_HOLDER from accessing /api/admin/dashboard with 403 Forbidden', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-regular-id',
        email: 'user@example.com',
        role: 'ACCOUNT_HOLDER'
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should reject ACCOUNT_HOLDER from approving onboarding applications with 403 Forbidden', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-regular-id',
        email: 'user@example.com',
        role: 'ACCOUNT_HOLDER'
      });

      const res = await request(app)
        .patch('/api/admin/onboarding/some-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to access /api/admin/dashboard', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-super-id',
        email: 'admin@balancevault.internal',
        role: 'ADMIN'
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
    });
  });

  describe('Resource Ownership Enforcement', () => {
    it('should forbid user from accessing another user account details with 403', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-regular-id',
        email: 'user@example.com',
        role: 'ACCOUNT_HOLDER'
      });

      // Account belongs to 'another-user-id'
      prisma.account.findUnique.mockResolvedValue({
        id: 'account-123',
        userId: 'another-user-id',
        accountNumber: '409211112222',
        balance: 1000000n,
        status: 'ACTIVE'
      });

      const res = await request(app)
        .get('/api/accounts/account-123')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not own this account/i);
    });

    it('should allow user to access their own account details', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-regular-id',
        email: 'user@example.com',
        role: 'ACCOUNT_HOLDER'
      });

      prisma.account.findUnique.mockResolvedValue({
        id: 'account-123',
        userId: 'user-regular-id',
        accountNumber: '409211112222',
        balance: 1000000n,
        status: 'ACTIVE'
      });

      const res = await request(app)
        .get('/api/accounts/account-123')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('account-123');
    });
  });
});
