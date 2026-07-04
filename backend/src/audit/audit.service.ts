import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    action: string,
    options: { userId?: string; request?: Request; metadata?: Record<string, unknown> } = {},
  ): Promise<void> {
    try {
      const ip =
        options.request?.ip ??
        options.request?.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim() ??
        options.request?.socket?.remoteAddress ??
        null;

      const userAgent =
        options.request?.headers?.['user-agent'] ?? null;

      await this.prisma.auditLog.create({
        data: {
          userId: options.userId ?? null,
          action,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log for action "${action}"`, err);
    }
  }
}
