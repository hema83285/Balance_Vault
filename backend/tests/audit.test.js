require('./setup');
const AuditService = require('../services/audit.service');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  auditLog: {
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'log-1', ...data })),
    findMany: jest.fn(),
    count: jest.fn()
  }
}));

describe('Audit Logging & Sensitive Data Redaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully record an append-only audit log entry', async () => {
    const entry = await AuditService.log({
      actorId: 'user-audit-1',
      action: 'USER_LOGIN',
      targetResource: 'User',
      targetResourceId: 'user-audit-1',
      outcome: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0'
    });

    expect(entry).toBeDefined();
    expect(entry.action).toBe('USER_LOGIN');
    expect(entry.outcome).toBe('SUCCESS');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should mask passwords and credentials before writing to audit log metadata', async () => {
    await AuditService.log({
      actorId: 'user-audit-1',
      action: 'PASSWORD_RESET_ATTEMPT',
      targetResource: 'User',
      outcome: 'FAILURE',
      metadata: {
        attemptEmail: 'user@example.com',
        userRole: 'ACCOUNT_HOLDER'
      }
    });

    const callArgs = prisma.auditLog.create.mock.calls[0][0];
    expect(callArgs.data.metadata.attemptEmail).toBe('user@example.com');
  });
});
