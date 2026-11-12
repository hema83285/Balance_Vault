const AdminService = require('../services/admin.service');
const AuditService = require('../services/audit.service');
const { successResponse } = require('../utils/response');

class AdminController {
  static async getDashboard(req, res, next) {
    try {
      const data = await AdminService.getDashboardMetrics();
      return successResponse(res, data, 'Admin dashboard metrics retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req, res, next) {
    try {
      const { page, limit, role, search } = req.query;
      const data = await AdminService.getAllUsers({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        role,
        search
      });
      return successResponse(res, data, 'Platform users retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const { page, limit, actorId, action, outcome } = req.query;
      const data = await AuditService.getLogs({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        actorId,
        action,
        outcome
      });
      return successResponse(res, data, 'Audit logs retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
