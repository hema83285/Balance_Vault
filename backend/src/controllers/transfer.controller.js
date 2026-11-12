const TransferService = require('../services/transfer.service');
const { successResponse } = require('../utils/response');

class TransferController {
  static async transfer(req, res, next) {
    try {
      const { senderAccountId, receiverAccountNumber, amountPaise, description } = req.body;
      const idempotencyKey = req.headers['idempotency-key'];

      const meta = {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id
      };

      const result = await TransferService.executeTransfer({
        userId: req.user.id,
        senderAccountId,
        receiverAccountNumber,
        amountPaise,
        description,
        idempotencyKey
      }, meta);

      return successResponse(res, result, 'Transfer completed successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getTransfers(req, res, next) {
    try {
      const { page, limit, accountId } = req.query;
      const result = await TransferService.getTransfers({
        userId: req.user.id,
        userRole: req.user.role,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        accountId
      });

      return successResponse(res, result, 'Transactions retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async getTransferById(req, res, next) {
    try {
      const { id } = req.params;
      const transfer = await TransferService.getTransferById(id, req.user);
      return successResponse(res, transfer, 'Transaction details retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransferController;
