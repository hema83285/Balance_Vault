const prisma = require('../config/db');
const { ACCOUNT_STATUS, AUDIT_OUTCOME } = require('../constants/statuses');
const AuditService = require('./audit.service');

class AccountService {
  /**
   * Generates a unique 12-digit numeric account number
   */
  static async generateUniqueAccountNumber() {
    let exists = true;
    let accountNumber = '';

    while (exists) {
      // 12-digit format starting with 4092 (BalanceVault branch code) + 8 random digits
      const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
      accountNumber = `4092${randomPart}`;

      const check = await prisma.account.findUnique({
        where: { accountNumber }
      });
      if (!check) {
        exists = false;
      }
    }

    return accountNumber;
  }

  /**
   * Creates a bank account for a user (typically invoked after onboarding approval)
   */
  static async createAccount({ userId, initialBalancePaise = 0n, status = ACCOUNT_STATUS.ACTIVE }, reqMeta = {}) {
    const accountNumber = await this.generateUniqueAccountNumber();

    const account = await prisma.account.create({
      data: {
        userId,
        accountNumber,
        balance: BigInt(initialBalancePaise),
        status,
        currency: 'INR'
      }
    });

    await AuditService.log({
      actorId: reqMeta.actorId || userId,
      action: 'ACCOUNT_CREATE',
      targetResource: 'Account',
      targetResourceId: account.id,
      outcome: AUDIT_OUTCOME.SUCCESS,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      requestId: reqMeta.requestId,
      metadata: { accountNumber, initialBalancePaise: initialBalancePaise.toString() }
    });

    return account;
  }

  /**
   * Get accounts for a user
   */
  static async getUserAccounts(userId) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get account details by ID, checking ownership or Admin privilege
   */
  static async getAccountById(accountId, requestingUser) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!account) {
      const error = new Error('Account not found');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    // Role-based access control: Only Admin or the account owner can view
    if (requestingUser.role !== 'ADMIN' && account.userId !== requestingUser.id) {
      const error = new Error('Access denied. You do not own this account.');
      error.statusCode = 403;
      error.isOperational = true;
      throw error;
    }

    return account;
  }

  /**
   * Admin: List all accounts with pagination
   */
  static async getAllAccounts({ page = 1, limit = 20, status, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { accountNumber: { contains: search } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.account.count({ where })
    ]);

    return {
      accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Admin: Update account status (ACTIVE, SUSPENDED, PENDING)
   */
  static async updateAccountStatus(accountId, newStatus, adminUser, reqMeta = {}) {
    if (!Object.values(ACCOUNT_STATUS).includes(newStatus)) {
      const error = new Error(`Invalid status. Must be one of: ${Object.values(ACCOUNT_STATUS).join(', ')}`);
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    const existing = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!existing) {
      const error = new Error('Account not found');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { status: newStatus }
    });

    await AuditService.log({
      actorId: adminUser.id,
      action: 'ACCOUNT_STATUS_CHANGE',
      targetResource: 'Account',
      targetResourceId: accountId,
      outcome: AUDIT_OUTCOME.SUCCESS,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      requestId: reqMeta.requestId,
      metadata: { previousStatus: existing.status, newStatus }
    });

    return updated;
  }
}

module.exports = AccountService;
