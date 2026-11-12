require('./setup');
const TransferService = require('../services/transfer.service');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  idempotencyRecord: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  },
  account: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  transaction: {
    create: jest.fn()
  },
  ledgerEntry: {
    create: jest.fn()
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-transfer-1' })
  },
  $transaction: jest.fn()
}));

describe('Money Movement & Transfer Integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testSenderUserId = 'user-sender-1';
  const testSenderAccountId = 'acc-sender-uuid';
  const testReceiverAccNumber = '409299998888';
  const testReceiverAccountId = 'acc-receiver-uuid';

  it('should reject transfer when amount is zero or negative', async () => {
    await expect(
      TransferService.executeTransfer({
        userId: testSenderUserId,
        senderAccountId: testSenderAccountId,
        receiverAccountNumber: testReceiverAccNumber,
        amountPaise: '0',
        idempotencyKey: 'key-zero-amount'
      })
    ).rejects.toThrow(/positive integer/i);
  });

  it('should reject transfer when Idempotency-Key is missing', async () => {
    await expect(
      TransferService.executeTransfer({
        userId: testSenderUserId,
        senderAccountId: testSenderAccountId,
        receiverAccountNumber: testReceiverAccNumber,
        amountPaise: '1000',
        idempotencyKey: null
      })
    ).rejects.toThrow(/Idempotency-Key header is required/i);
  });

  it('should return cached response if idempotency key has already been completed', async () => {
    const cachedData = {
      transactionId: 'tx-cached-123',
      amount: '50000',
      status: 'COMPLETED'
    };

    prisma.idempotencyRecord.findUnique.mockResolvedValue({
      key: 'key-already-processed',
      responseBody: cachedData
    });

    const result = await TransferService.executeTransfer({
      userId: testSenderUserId,
      senderAccountId: testSenderAccountId,
      receiverAccountNumber: testReceiverAccNumber,
      amountPaise: '50000',
      idempotencyKey: 'key-already-processed'
    });

    expect(result.fromCache).toBe(true);
    expect(result.transactionId).toBe('tx-cached-123');
  });

  it('should reject self-transfers when sender and receiver account are identical', async () => {
    prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
    prisma.idempotencyRecord.create.mockResolvedValue({ id: 'idemp-1' });

    prisma.account.findUnique.mockResolvedValue({
      id: testSenderAccountId,
      accountNumber: '409211112222',
      userId: testSenderUserId
    });

    await expect(
      TransferService.executeTransfer({
        userId: testSenderUserId,
        senderAccountId: testSenderAccountId,
        receiverAccountNumber: '409211112222',
        amountPaise: '5000',
        idempotencyKey: 'key-self-transfer'
      })
    ).rejects.toThrow(/same account are prohibited/i);
  });

  it('should atomically transfer funds, lock rows, update balances, and create double-entry ledger', async () => {
    prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
    prisma.idempotencyRecord.create.mockResolvedValue({ id: 'idemp-2' });

    // Mock finding receiver account
    prisma.account.findUnique.mockImplementation(({ where }) => {
      if (where.accountNumber === testReceiverAccNumber) {
        return Promise.resolve({
          id: testReceiverAccountId,
          accountNumber: testReceiverAccNumber,
          userId: 'user-receiver-2',
          balance: 200000n, // ₹2,000
          status: 'ACTIVE'
        });
      }
      return Promise.resolve(null);
    });

    // Mock $transaction execution
    prisma.$transaction.mockImplementation(async (callback) => {
      const mockTx = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        account: {
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (where.id === testSenderAccountId) {
              return Promise.resolve({
                id: testSenderAccountId,
                accountNumber: '409211110000',
                userId: testSenderUserId,
                balance: 1000000n, // ₹10,000
                status: 'ACTIVE'
              });
            }
            if (where.id === testReceiverAccountId) {
              return Promise.resolve({
                id: testReceiverAccountId,
                accountNumber: testReceiverAccNumber,
                userId: 'user-receiver-2',
                balance: 200000n, // ₹2,000
                status: 'ACTIVE'
              });
            }
          }),
          update: jest.fn().mockResolvedValue({})
        },
        transaction: {
          create: jest.fn().mockResolvedValue({
            id: 'tx-completed-uuid-1',
            idempotencyKey: 'valid-transfer-key',
            amount: 150000n, // ₹1,500
            status: 'COMPLETED'
          })
        },
        ledgerEntry: {
          create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'le-1', ...data }))
        }
      };

      return callback(mockTx);
    });

    prisma.idempotencyRecord.update.mockResolvedValue({});

    const result = await TransferService.executeTransfer({
      userId: testSenderUserId,
      senderAccountId: testSenderAccountId,
      receiverAccountNumber: testReceiverAccNumber,
      amountPaise: '150000', // ₹1,500
      description: 'Consulting fees',
      idempotencyKey: 'valid-transfer-key'
    });

    expect(result.transaction.id).toBe('tx-completed-uuid-1');
    expect(result.newBalance).toBe((1000000n - 150000n).toString());
    expect(prisma.idempotencyRecord.update).toHaveBeenCalled();
  });
});
