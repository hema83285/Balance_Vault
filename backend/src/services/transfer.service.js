const crypto = require('crypto');
const prisma = require('../config/db');
const { ACCOUNT_STATUS, TRANSACTION_STATUS, LEDGER_ENTRY_TYPE, AUDIT_OUTCOME } = require('../constants/statuses');
const AuditService = require('./audit.service');

class TransferService {
  /**
   * Executes an atomic money transfer between two accounts with idempotency,
   * row-level locking, double-entry ledger creation, and comprehensive audit logs.
   */
  static async executeTransfer({
    userId,
    senderAccountId,
    receiverAccountNumber,
    amountPaise,
    description = 'Fund transfer',
    idempotencyKey
  }, reqMeta = {}) {
    // 1. Basic validation
    const parsedAmount = BigInt(amountPaise);
    if (parsedAmount <= 0n) {
      const error = new Error('Transfer amount must be a positive integer in paise.');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      const error = new Error('Idempotency-Key header is required for all money transfers.');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    // 2. Check Idempotency Record
    const requestHash = crypto
      .createHash('sha256')
      .update(`${userId}:${senderAccountId}:${receiverAccountNumber}:${amountPaise}`)
      .digest('hex');

    const existingKey = await prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey }
    });

    if (existingKey) {
      if (existingKey.responseBody) {
        // Return cached identical response
        return {
          fromCache: true,
          ...existingKey.responseBody
        };
      } else {
        // Request with this key is currently executing
        const error = new Error('A transfer with this idempotency key is currently processing. Please wait.');
        error.statusCode = 409;
        error.isOperational = true;
        throw error;
      }
    }

    // Reserve idempotency lock record (expires in 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.idempotencyRecord.create({
      data: {
        key: idempotencyKey,
        userId,
        endpoint: '/api/transfers',
        requestHash,
        expiresAt
      }
    });

    try {
      // 3. Find receiver account by account number
      const receiverAccount = await prisma.account.findUnique({
        where: { accountNumber: receiverAccountNumber.trim() },
        include: { user: true }
      });

      if (!receiverAccount) {
        const error = new Error(`Recipient account number ${receiverAccountNumber} not found.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
      }

      // Check self-transfer
      if (senderAccountId === receiverAccount.id) {
        const error = new Error('Transfers to the same account are prohibited.');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
      }

      // 4. Execute atomic transaction with Row-Level Locking
      const result = await prisma.$transaction(async (tx) => {
        // Lock both account rows in deterministic order to prevent deadlocks
        const accountIdsToLock = [senderAccountId, receiverAccount.id].sort();
        
        // Execute raw pessimistic lock on PostgreSQL
        await tx.$queryRaw`
          SELECT id, balance, status FROM "Account"
          WHERE id IN (${accountIdsToLock[0]}, ${accountIdsToLock[1]})
          FOR UPDATE
        `;

        // Refetch fresh account records inside locked transaction
        const sender = await tx.account.findUnique({ where: { id: senderAccountId } });
        const receiver = await tx.account.findUnique({ where: { id: receiverAccount.id } });

        // Verify sender ownership
        if (sender.userId !== userId) {
          const error = new Error('Unauthorized. You do not own the sender account.');
          error.statusCode = 403;
          error.isOperational = true;
          throw error;
        }

        // Verify sender account status
        if (sender.status !== ACCOUNT_STATUS.ACTIVE) {
          const error = new Error(`Sender account is ${sender.status}. Only ACTIVE accounts can send transfers.`);
          error.statusCode = 403;
          error.isOperational = true;
          throw error;
        }

        // Verify receiver account status
        if (receiver.status !== ACCOUNT_STATUS.ACTIVE) {
          const error = new Error(`Receiver account is ${receiver.status}. Cannot transfer funds to inactive accounts.`);
          error.statusCode = 400;
          error.isOperational = true;
          throw error;
        }

        // Verify available balance
        if (sender.balance < parsedAmount) {
          const error = new Error(`Insufficient funds. Available balance: ${sender.balance} paise, requested: ${parsedAmount} paise.`);
          error.statusCode = 400;
          error.isOperational = true;
          throw error;
        }

        // Compute new balances
        const newSenderBalance = sender.balance - parsedAmount;
        const newReceiverBalance = receiver.balance + parsedAmount;

        // Atomically update sender and receiver balances
        await tx.account.update({
          where: { id: sender.id },
          data: { balance: newSenderBalance }
        });

        await tx.account.update({
          where: { id: receiver.id },
          data: { balance: newReceiverBalance }
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            idempotencyKey,
            senderAccountId: sender.id,
            receiverAccountId: receiver.id,
            amount: parsedAmount,
            status: TRANSACTION_STATUS.COMPLETED,
            description: description.trim()
          }
        });

        // Create matching double-entry ledger records
        const debitEntry = await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: sender.id,
            entryType: LEDGER_ENTRY_TYPE.DEBIT,
            amount: parsedAmount,
            balanceAfter: newSenderBalance
          }
        });

        const creditEntry = await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: receiver.id,
            entryType: LEDGER_ENTRY_TYPE.CREDIT,
            amount: parsedAmount,
            balanceAfter: newReceiverBalance
          }
        });

        return {
          transaction,
          senderAccount: { id: sender.id, accountNumber: sender.accountNumber, balance: newSenderBalance },
          receiverAccount: { id: receiver.id, accountNumber: receiver.accountNumber, balance: newReceiverBalance },
          ledgerEntries: [debitEntry, creditEntry]
        };
      });

      // 5. Record successful audit log
      await AuditService.log({
        actorId: userId,
        action: 'TRANSFER_SUCCESS',
        targetResource: 'Transaction',
        targetResourceId: result.transaction.id,
        outcome: AUDIT_OUTCOME.SUCCESS,
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        requestId: reqMeta.requestId,
        metadata: {
          senderAccountId,
          receiverAccountNumber,
          amountPaise: parsedAmount.toString(),
          transactionId: result.transaction.id
        }
      });

      // 6. Cache idempotency response
      const responsePayload = {
        transaction: result.transaction,
        senderAccountId: result.senderAccount.id,
        newBalance: result.senderAccount.balance.toString(),
        receiverAccountNumber
      };

      await prisma.idempotencyRecord.update({
        where: { key: idempotencyKey },
        data: {
          responseStatusCode: 201,
          responseBody: responsePayload
        }
      });

      return responsePayload;
    } catch (err) {
      // Record failure in audit log
      await AuditService.log({
        actorId: userId,
        action: 'TRANSFER_FAILURE',
        targetResource: 'Transaction',
        outcome: AUDIT_OUTCOME.FAILURE,
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        requestId: reqMeta.requestId,
        metadata: {
          senderAccountId,
          receiverAccountNumber,
          amountPaise: parsedAmount ? parsedAmount.toString() : '0',
          error: err.message
        }
      });

      // Clean up in-flight idempotency key so user can retry safely
      await prisma.idempotencyRecord.deleteMany({
        where: { key: idempotencyKey, responseBody: null }
      });

      throw err;
    }
  }

  /**
   * Get transaction history for current user or admin
   */
  static async getTransfers({ userId, userRole, page = 1, limit = 20, accountId }) {
    const skip = (page - 1) * limit;
    let where = {};

    if (userRole === 'ADMIN') {
      if (accountId) {
        where.OR = [
          { senderAccountId: accountId },
          { receiverAccountId: accountId }
        ];
      }
    } else {
      // Account holder: can only view transactions related to their own accounts
      const userAccounts = await prisma.account.findMany({
        where: { userId },
        select: { id: true }
      });
      const accountIds = userAccounts.map(a => a.id);

      if (accountId && accountIds.includes(accountId)) {
        where.OR = [
          { senderAccountId: accountId },
          { receiverAccountId: accountId }
        ];
      } else {
        where.OR = [
          { senderAccountId: { in: accountIds } },
          { receiverAccountId: { in: accountIds } }
        ];
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          senderAccount: {
            select: {
              id: true,
              accountNumber: true,
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          },
          receiverAccount: {
            select: {
              id: true,
              accountNumber: true,
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          },
          ledgerEntries: true
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single transfer details by ID
   */
  static async getTransferById(transferId, requestingUser) {
    const transfer = await prisma.transaction.findUnique({
      where: { id: transferId },
      include: {
        senderAccount: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
        },
        receiverAccount: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
        },
        ledgerEntries: true
      }
    });

    if (!transfer) {
      const error = new Error('Transaction record not found.');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    // Role check: Admin or participant
    if (
      requestingUser.role !== 'ADMIN' &&
      transfer.senderAccount.userId !== requestingUser.id &&
      transfer.receiverAccount.userId !== requestingUser.id
    ) {
      const error = new Error('Access denied. You are not a party to this transaction.');
      error.statusCode = 403;
      error.isOperational = true;
      throw error;
    }

    return transfer;
  }
}

module.exports = TransferService;
