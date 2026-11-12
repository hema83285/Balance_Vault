require('./setup');
const LedgerService = require('../services/ledger.service');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  transaction: {
    findMany: jest.fn()
  },
  account: {
    findMany: jest.fn()
  }
}));

describe('Financial Double-Entry Ledger Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify ledger as HEALTHY when debits and credits match perfectly', async () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        amount: 500000n,
        status: 'COMPLETED',
        ledgerEntries: [
          { entryType: 'DEBIT', amount: 500000n },
          { entryType: 'CREDIT', amount: 500000n }
        ]
      },
      {
        id: 'tx-2',
        amount: 250000n,
        status: 'COMPLETED',
        ledgerEntries: [
          { entryType: 'DEBIT', amount: 250000n },
          { entryType: 'CREDIT', amount: 250000n }
        ]
      }
    ];

    prisma.transaction.findMany.mockResolvedValue(mockTransactions);
    prisma.account.findMany.mockResolvedValue([]);

    const report = await LedgerService.verifyLedgerIntegrity();

    expect(report.isValid).toBe(true);
    expect(report.status).toBe('HEALTHY');
    expect(report.summary.totalTransactionsAudited).toBe(2);
    expect(report.summary.totalDebitsPaise).toBe('750000');
    expect(report.summary.totalCreditsPaise).toBe('750000');
    expect(report.discrepancies.length).toBe(0);
  });

  it('should flag ledger as COMPROMISED when a transaction has unequal debit and credit entries', async () => {
    const corruptTransactions = [
      {
        id: 'tx-corrupt-1',
        amount: 500000n,
        status: 'COMPLETED',
        ledgerEntries: [
          { entryType: 'DEBIT', amount: 500000n },
          { entryType: 'CREDIT', amount: 400000n } // Imbalance of 100000 paise
        ]
      }
    ];

    prisma.transaction.findMany.mockResolvedValue(corruptTransactions);
    prisma.account.findMany.mockResolvedValue([]);

    const report = await LedgerService.verifyLedgerIntegrity();

    expect(report.isValid).toBe(false);
    expect(report.status).toBe('COMPROMISED');
    expect(report.discrepancies.length).toBeGreaterThan(0);
    expect(report.discrepancies[0].type).toBe('AMOUNT_MISMATCH');
  });
});
