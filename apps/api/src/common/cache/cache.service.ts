import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private redisClient: Redis;
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl: number;

  public readonly keys = {
    concept: (id: string) => `concept:${id}`,
    student: {
      mastery: (studentId: string) => `student:${studentId}:mastery`,
      learningPlan: (studentId: string) => `student:${studentId}:learningPlan`,
    },
    teacher: {
      dashboard: (teacherId: string) => `teacher:${teacherId}:dashboard`,
    },
    class: {
      overview: (classId: string) => `class:${classId}:overview`,
    },
    assessment: {
      metadata: (assessmentId: string) => `assessment:${assessmentId}:metadata`,
    }
  };

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.defaultTtl = parseInt(this.configService.get<string>('CACHE_TTL', '300'), 10);

    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Fail fast
    });

    this.redisClient.on('error', (err) => {
      this.logger.warn(`Redis connection error in CacheService: ${err.message}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = this.defaultTtl): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await this.redisClient.setex(key, ttlSeconds, data);
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${(error as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.warn(`Cache del error for key ${key}: ${(error as Error).message}`);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const result = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(`Cache invalidatePattern error for pattern ${pattern}: ${(error as Error).message}`);
    }
  }
}
