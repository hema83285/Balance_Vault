const prisma = require('../config/db');
const { ACCOUNT_STATUS, ONBOARDING_STATUS, TRANSACTION_STATUS } = require('../constants/statuses');

class AdminService {
  /**
   * System-Wide Dashboard KPIs and Analytics
   */
  static async getDashboardMetrics() {
    const [
      totalUsers,
      totalAccounts,
      activeAccounts,
      pendingOnboardings,
      totalTransactions,
      completedTransactions,
      recentAuditLogs,
      recentTransactions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.account.count({ where: { status: ACCOUNT_STATUS.ACTIVE } }),
      prisma.onboarding.count({ where: { status: ONBOARDING_STATUS.PENDING } }),
      prisma.transaction.count(),
      prisma.transaction.findMany({
        where: { status: TRANSACTION_STATUS.COMPLETED },
        select: { amount: true }
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true }
          }
        }
      }),
      prisma.transaction.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          senderAccount: {
            select: { accountNumber: true, user: { select: { firstName: true, lastName: true } } }
          },
          receiverAccount: {
            select: { accountNumber: true, user: { select: { firstName: true, lastName: true } } }
          }
        }
      })
    ]);

    // Calculate total transaction volume in paise
    let totalVolumePaise = 0n;
    for (const tx of completedTransactions) {
      totalVolumePaise += tx.amount;
    }

    return {
      kpis: {
        totalUsers,
        totalAccounts,
        activeAccounts,
        suspendedAccounts: totalAccounts - activeAccounts,
        pendingOnboardings,
        totalTransactions,
        completedTransactionsCount: completedTransactions.length,
        totalVolumePaise: totalVolumePaise.toString()
      },
      recentAuditLogs,
      recentTransactions
    };
  }

  /**
   * List all users with accounts and onboarding status
   */
  static async getAllUsers({ page = 1, limit = 20, role, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          onboarding: {
            select: { id: true, status: true, panNumber: true, createdAt: true }
          },
          accounts: {
            select: { id: true, accountNumber: true, balance: true, status: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = AdminService;
