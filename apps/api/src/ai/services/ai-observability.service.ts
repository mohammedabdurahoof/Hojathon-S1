import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogAiInteractionParams {
  studentId?: string;
  provider: string;
  model: string;
  operation: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  tokenUsage?: any;
}

@Injectable()
export class AiObservabilityService {
  private readonly logger = new Logger(AiObservabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logInteraction(params: LogAiInteractionParams) {
    try {
      await this.prisma.aiInteractionLog.create({
        data: {
          studentId: params.studentId,
          provider: params.provider,
          model: params.model,
          operation: params.operation,
          latencyMs: params.latencyMs,
          success: params.success,
          error: params.error,
          tokenUsage: params.tokenUsage ?? { totalTokens: 0 },
        },
      });

      this.logger.log(
        `Logged AI operation "${params.operation}" (${params.latencyMs}ms, success=${params.success}) for student "${params.studentId ?? 'N/A'}"`,
      );
    } catch (e: any) {
      this.logger.error(`Failed to record AI interaction log: ${e.message}`);
    }
  }

  async getUsageMetrics() {
    const totalRequests = await this.prisma.aiInteractionLog.count();
    const successfulRequests = await this.prisma.aiInteractionLog.count({ where: { success: true } });
    const failedRequests = await this.prisma.aiInteractionLog.count({ where: { success: false } });

    const logs = await this.prisma.aiInteractionLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const avgLatency = logs.length > 0 ? logs.reduce((acc, l) => acc + l.latencyMs, 0) / logs.length : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLatencyMs: Math.round(avgLatency),
      recentLogs: logs.map((l) => ({
        id: l.id,
        studentId: l.studentId,
        provider: l.provider,
        model: l.model,
        operation: l.operation,
        latencyMs: l.latencyMs,
        success: l.success,
        error: l.error,
        createdAt: l.createdAt,
      })),
    };
  }
}
