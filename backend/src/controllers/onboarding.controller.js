const OnboardingService = require('../services/onboarding.service');
const { successResponse } = require('../utils/response');

class OnboardingController {
  static async submit(req, res, next) {
    try {
      const meta = {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id
      };

      const result = await OnboardingService.submitOnboarding(req.user.id, req.body, meta);
      return successResponse(res, result, 'KYC onboarding application submitted successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(req, res, next) {
    try {
      const status = await OnboardingService.getStatus(req.user.id);
      return successResponse(res, status, 'Onboarding status retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async listAdminOnboardings(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await OnboardingService.getAllOnboardings({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        status
      });
      return successResponse(res, result, 'Onboarding applications retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async reviewAdminOnboarding(req, res, next) {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const meta = {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id
      };

      const result = await OnboardingService.reviewOnboarding(
        id,
        { status, rejectionReason },
        req.user,
        meta
      );

      const message = status === 'APPROVED'
        ? 'Application approved and financial account provisioned successfully.'
        : 'Application rejected.';

      return successResponse(res, result, message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OnboardingController;
