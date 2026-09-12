import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface FailedJob {
  id: string;
  name: string;
  data: Record<string, any>;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsageMb: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  httpRequestsTotal: number;
  httpErrorsTotal: number;
  activeConnections: number;
  environment: string;
  version: string;
  commit: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns application version and build information.
   * Safe to expose — contains no sensitive data.
   */
  getVersion() {
    return {
      version: this.configService.get<string>('APP_VERSION', '0.0.0'),
      commit: this.configService.get<string>('APP_COMMIT', 'unknown'),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    };
  }

  /**
   * Returns current system metrics.
   * Only expose to admin users — never to students.
   */
  getSystemMetrics(): SystemMetrics {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    return {
      uptime: process.uptime(),
      memoryUsageMb: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
      },
      cpuUsage: {
        user: cpu.user,
        system: cpu.system,
      },
      httpRequestsTotal: 0, // populated by MetricsService
      httpErrorsTotal: 0,   // populated by MetricsService
      activeConnections: 0,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '0.0.0',
      commit: process.env.APP_COMMIT || 'unknown',
    };
  }

  /**
   * Returns queue metrics placeholder.
   * In a full BullMQ setup, this would query actual queue stats.
   */
  async getQueueMetrics(): Promise<QueueMetrics[]> {
    // Placeholder — in production, use BullMQ Queue.getJobCounts()
    const queues = [
      'document-processing',
      'ai-generation',
      'embedding-generation',
      'assessment-analytics',
      'teacher-analytics',
      'question-statistics',
      'notifications',
    ];

    return queues.map((queueName) => ({
      queueName,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }));
  }

  /**
   * Returns failed jobs.
   * In production, query BullMQ failed job store.
   */
  async getFailedJobs(limit = 50): Promise<FailedJob[]> {
    this.logger.log(`Admin: retrieving failed jobs (limit: ${limit})`);
    // Placeholder — in production, use BullMQ Queue.getFailed()
    return [];
  }

  /**
   * Feature flag status for admin visibility.
   */
  getFeatureFlags() {
    return {
      AI_TUTOR_ENABLED: process.env.AI_TUTOR_ENABLED !== 'false',
      AI_PRACTICE_ENABLED: process.env.AI_PRACTICE_ENABLED !== 'false',
      AI_ASSESSMENT_GENERATION_ENABLED: process.env.AI_ASSESSMENT_GENERATION_ENABLED !== 'false',
      RAG_ENABLED: process.env.RAG_ENABLED !== 'false',
      ADAPTIVE_ASSESSMENT_ENABLED: process.env.ADAPTIVE_ASSESSMENT_ENABLED !== 'false',
      TEACHER_AI_ENABLED: process.env.TEACHER_AI_ENABLED !== 'false',
      MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true',
      RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
    };
  }
}
