const LedgerService = require('../services/ledger.service');
const { successResponse } = require('../utils/response');

class LedgerController {
  static async getEntriesByTransaction(req, res, next) {
    try {
      const { transactionId } = req.params;
      const entries = await LedgerService.getEntriesByTransaction(transactionId, req.user);
      return successResponse(res, entries, 'Ledger entries retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async verifyLedger(req, res, next) {
    try {
      const report = await LedgerService.verifyLedgerIntegrity();
      return successResponse(res, report, 'Ledger integrity report generated.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LedgerController;
