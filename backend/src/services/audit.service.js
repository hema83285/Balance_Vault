const prisma = require('../config/db');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Append an immutable audit log record.
   */
  static async log({
    actorId = null,
    action,
    targetResource,
    targetResourceId = null,
    outcome,
    ipAddress = null,
    userAgent = null,
    requestId = null,
    metadata = null
  }) {
    try {
      // Mask any sensitive keys in metadata before recording
      const safeMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : null;

      const record = await prisma.auditLog.create({
        data: {
          actorId,
          action,
          targetResource,
          targetResourceId,
          outcome,
          ipAddress,
          userAgent,
          requestId,
          metadata: safeMetadata
        }
      });

      logger.info(`[AUDIT] ${action} (${outcome}) by actor ${actorId || 'SYSTEM'}`);
      return record;
    } catch (error) {
      // Audit log failures should not take down the entire system, but must be logged
      logger.error('Failed to write audit log entry', {
        action,
        error: error.message
      });
      return null;
    }
  }

  static async getLogs({ page = 1, limit = 20, actorId, action, outcome }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (actorId) where.actorId = actorId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (outcome) where.outcome = outcome;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = AuditService;
