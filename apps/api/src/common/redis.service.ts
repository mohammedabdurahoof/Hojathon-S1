import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.logger.log(`Initialized Redis abstraction for URL: ${this.redisUrl}`);
  }

  getRedisConfig() {
    return {
      url: this.redisUrl,
    };
  }

  getQueueConfig(queueName: string) {
    this.logger.log(`Registered BullMQ queue abstraction: ${queueName}`);
    return {
      name: queueName,
      redisUrl: this.redisUrl,
    };
  }
}
