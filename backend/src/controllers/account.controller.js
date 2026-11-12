const AccountService = require('../services/account.service');
const { successResponse } = require('../utils/response');

class AccountController {
  static async getAccounts(req, res, next) {
    try {
      if (req.user.role === 'ADMIN') {
        const { page, limit, status, search } = req.query;
        const result = await AccountService.getAllAccounts({
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
          status,
          search
        });
        return successResponse(res, result, 'All accounts retrieved.');
      } else {
        const accounts = await AccountService.getUserAccounts(req.user.id);
        return successResponse(res, accounts, 'User accounts retrieved.');
      }
    } catch (error) {
      next(error);
    }
  }

  static async getAccountById(req, res, next) {
    try {
      const { id } = req.params;
      const account = await AccountService.getAccountById(id, req.user);
      return successResponse(res, account, 'Account details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async updateAccountStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const meta = {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id
      };

      const updated = await AccountService.updateAccountStatus(id, status, req.user, meta);
      return successResponse(res, updated, `Account status changed to ${status}.`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AccountController;
