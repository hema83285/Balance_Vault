const AuthService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const meta = {
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        requestId: req.id
      };

      const result = await AuthService.register({ email, password, firstName, lastName, phone }, meta);
      return successResponse(res, result, 'User registered successfully. Welcome to BalanceVault!', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const meta = {
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        requestId: req.id
      };

      const result = await AuthService.login({ email, password }, meta);
      return successResponse(res, result, 'Login successful.');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      return successResponse(res, null, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      return successResponse(res, user, 'Profile retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
