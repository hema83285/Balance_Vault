const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const ENV = require('../config/env');
const ROLES = require('../constants/roles');
const AuditService = require('./audit.service');
const { AUDIT_OUTCOME } = require('../constants/statuses');

class AuthService {
  static async register({ email, password, firstName, lastName, phone }, reqMeta = {}) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      await AuditService.log({
        action: 'USER_REGISTER',
        targetResource: 'User',
        outcome: AUDIT_OUTCOME.FAILURE,
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        requestId: reqMeta.requestId,
        metadata: { reason: 'Duplicate email registration attempt' }
      });
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    // Hash password with 12 rounds
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user strictly with role ACCOUNT_HOLDER (never allow public admin creation)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: ROLES.ACCOUNT_HOLDER,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true
      }
    });

    // Audit log
    await AuditService.log({
      actorId: user.id,
      action: 'USER_REGISTER',
      targetResource: 'User',
      targetResourceId: user.id,
      outcome: AUDIT_OUTCOME.SUCCESS,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      requestId: reqMeta.requestId,
      metadata: { role: user.role }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    return { user, token };
  }

  static async login({ email, password }, reqMeta = {}) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      await AuditService.log({
        action: 'USER_LOGIN',
        targetResource: 'User',
        outcome: AUDIT_OUTCOME.FAILURE,
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        requestId: reqMeta.requestId,
        metadata: { reason: 'User not found' }
      });
      const error = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      error.isOperational = true;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await AuditService.log({
        actorId: user.id,
        action: 'USER_LOGIN',
        targetResource: 'User',
        targetResourceId: user.id,
        outcome: AUDIT_OUTCOME.FAILURE,
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
        requestId: reqMeta.requestId,
        metadata: { reason: 'Password mismatch' }
      });
      const error = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      error.isOperational = true;
      throw error;
    }

    // Success audit log
    await AuditService.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      targetResource: 'User',
      targetResourceId: user.id,
      outcome: AUDIT_OUTCOME.SUCCESS,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      requestId: reqMeta.requestId
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt
    };

    return { user: safeUser, token };
  }

  static async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        onboarding: true,
        accounts: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    return user;
  }
}

module.exports = AuthService;
