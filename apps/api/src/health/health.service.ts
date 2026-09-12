import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  details?: string;
  responseTimeMs?: number;
}

export interface ReadinessResult {
  status: 'ready' | 'not_ready';
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Basic liveness — the process is alive and can respond.
   * Does NOT check database or Redis — only that the process runs.
   */
  getLiveness() {
    return {
      status: 'ok',
      service: 'ai-remedial-learning-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '0.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Full application health (same as liveness for backwards compatibility)
   */
  getHealth() {
    return this.getLiveness();
  }

  /**
   * Readiness — checks all critical dependencies.
   * Kubernetes/load balancer uses this to decide if traffic can be routed here.
   */
  async getReadiness(): Promise<ReadinessResult> {
    const [dbResult, redisResult] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const database =
      dbResult.status === 'fulfilled'
        ? dbResult.value
        : { status: 'error' as const, details: 'Database check threw an exception' };

    const redis =
      redisResult.status === 'fulfilled'
        ? redisResult.value
        : { status: 'error' as const, details: 'Redis check threw an exception' };

    const allOk = database.status === 'ok' && redis.status === 'ok';

    return {
      status: allOk ? 'ready' : 'not_ready',
      checks: {
        database,
        redis,
      },
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Simple query that doesn't return sensitive data
      await this.prisma.$queryRaw`SELECT 1 AS health`;
      return {
        status: 'ok',
        responseTimeMs: Date.now() - start,
      };
    } catch (err: any) {
      this.logger.warn(`Health check: database unavailable — ${err.message}`);
      return {
        status: 'error',
        details: 'Database connection failed',
        responseTimeMs: Date.now() - start,
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const healthy = await this.redis.isHealthy();
      return {
        status: healthy ? 'ok' : 'error',
        details: healthy ? undefined : 'Redis ping failed',
        responseTimeMs: Date.now() - start,
      };
    } catch (err: any) {
      this.logger.warn(`Health check: Redis unavailable — ${err.message}`);
      return {
        status: 'error',
        details: 'Redis connection failed',
        responseTimeMs: Date.now() - start,
      };
    }
  }
}
