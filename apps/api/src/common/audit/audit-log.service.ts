import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly sensitiveKeys = new Set(['password', 'passwordhash', 'token', 'refreshtoken', 'accesstoken', 'apikey']);

  constructor(private readonly prisma: PrismaService) {}

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    if (!metadata) return metadata;
    const sanitized = { ...metadata };
    for (const key of Object.keys(sanitized)) {
      if (this.sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  async log(params: {
    actorId?: string;
    actorRole?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Cast string action to AuditAction enum (fallback to UNAUTHORIZED_ACCESS_ATTEMPT if invalid)
      const auditAction = (Object.values(AuditAction).includes(params.action as AuditAction)
        ? params.action
        : AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT) as AuditAction;

      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: auditAction,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          metadata: this.sanitizeMetadata(params.metadata || {}),
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write audit log: ${(error as Error).message}`);
    }
  }
}
