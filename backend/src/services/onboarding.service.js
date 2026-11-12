const prisma = require('../config/db');
const { ONBOARDING_STATUS, AUDIT_OUTCOME, ACCOUNT_STATUS } = require('../constants/statuses');
const AuditService = require('./audit.service');
const AccountService = require('./account.service');

class OnboardingService {
  /**
   * User submits KYC details
   */
  static async submitOnboarding(userId, data, reqMeta = {}) {
    // Check if user already submitted
    const existing = await prisma.onboarding.findUnique({
      where: { userId }
    });

    if (existing) {
      if (existing.status === ONBOARDING_STATUS.APPROVED) {
        const error = new Error('You already have an approved onboarding application.');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
      }
      if (existing.status === ONBOARDING_STATUS.PENDING) {
        const error = new Error('Your onboarding application is already pending review.');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
      }
    }

    // Check PAN uniqueness
    const duplicatePan = await prisma.onboarding.findFirst({
      where: { panNumber: data.panNumber.toUpperCase().trim(), userId: { not: userId } }
    });
    if (duplicatePan) {
      const error = new Error('This PAN number is already registered to another account.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    // Check Aadhar uniqueness
    const duplicateAadhar = await prisma.onboarding.findFirst({
      where: { aadharNumber: data.aadharNumber.trim(), userId: { not: userId } }
    });
    if (duplicateAadhar) {
      const error = new Error('This Aadhar number is already registered to another account.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    // Upsert or create onboarding application
    const onboarding = await prisma.onboarding.upsert({
      where: { userId },
      update: {
        panNumber: data.panNumber.toUpperCase().trim(),
        aadharNumber: data.aadharNumber.trim(),
        dateOfBirth: new Date(data.dateOfBirth),
        address: data.address.trim(),
        annualIncome: parseInt(data.annualIncome, 10),
        employmentStatus: data.employmentStatus.trim(),
        status: ONBOARDING_STATUS.PENDING,
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null
      },
      create: {
        userId,
        panNumber: data.panNumber.toUpperCase().trim(),
        aadharNumber: data.aadharNumber.trim(),
        dateOfBirth: new Date(data.dateOfBirth),
        address: data.address.trim(),
        annualIncome: parseInt(data.annualIncome, 10),
        employmentStatus: data.employmentStatus.trim(),
        status: ONBOARDING_STATUS.PENDING
      }
    });

    await AuditService.log({
      actorId: userId,
      action: 'ONBOARDING_SUBMIT',
      targetResource: 'Onboarding',
      targetResourceId: onboarding.id,
      outcome: AUDIT_OUTCOME.SUCCESS,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      requestId: reqMeta.requestId
    });

    return onboarding;
  }

  /**
   * Get onboarding status for current user
   */
  static async getStatus(userId) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return onboarding || { status: 'NOT_SUBMITTED' };
  }

  /**
   * Admin: List all onboarding submissions with optional status filter
   */
  static async getAllOnboardings({ page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    const [onboardings, total] = await Promise.all([
      prisma.onboarding.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.onboarding.count({ where })
    ]);

    return {
      onboardings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Admin: Review and approve/reject onboarding application
   */
  static async reviewOnboarding(onboardingId, { status, rejectionReason }, adminUser, reqMeta = {}) {
    if (![ONBOARDING_STATUS.APPROVED, ONBOARDING_STATUS.REJECTED].includes(status)) {
      const error = new Error('Invalid review status. Must be APPROVED or REJECTED.');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    const application = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: { user: true }
    });

    if (!application) {
      const error = new Error('Onboarding application not found.');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    const updated = await prisma.onboarding.update({
      where: { id: onboardingId },
      data: {
        status,
        rejectionReason: status === ONBOARDING_STATUS.REJECTED ? rejectionReason : null,
        reviewedBy: adminUser.id,
        reviewedAt: new Date()
      }
    });

    // If APPROVED, create an active Account with a demo starter balance (₹10,000 / 1,000,000 paise)
    let createdAccount = null;
    if (status === ONBOARDING_STATUS.APPROVED) {
      // Check if user already has an active account
      const existingAccounts = await prisma.account.findMany({
        where: { userId: application.userId }
      });

      if (existingAccounts.length === 0) {
        // Starter balance of 10,000 INR = 1,000,000 paise
        const starterPaise = 1000000n;
        createdAccount = await AccountService.createAccount(
          {
            userId: application.userId,
            initialBalancePaise: starterPaise,
            status: ACCOUNT_STATUS.ACTIVE
          },
          reqMeta
        );
      }
    }

    await AuditService.log({
      actorId: adminUser.id,
      action: status === ONBOARDING_STATUS.APPROVED ? 'ONBOARDING_APPROVE' : 'ONBOARDING_REJECT',
      targetResource: 'Onboarding',
      targetResourceId: onboardingId,
      outcome: AUDIT_OUTCOME.SUCCESS,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      requestId: reqMeta.requestId,
      metadata: {
        userId: application.userId,
        status,
        rejectionReason: status === ONBOARDING_STATUS.REJECTED ? rejectionReason : undefined,
        createdAccountId: createdAccount?.id
      }
    });

    return { onboarding: updated, account: createdAccount };
  }
}

module.exports = OnboardingService;
