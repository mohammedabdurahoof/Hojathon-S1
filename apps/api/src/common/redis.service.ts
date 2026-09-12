import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient(): void {
    const url = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    const connectTimeout = this.configService.get<number>('REDIS_CONNECT_TIMEOUT', 10000);
    const commandTimeout = this.configService.get<number>('REDIS_COMMAND_TIMEOUT', 5000);

    try {
      this.client = new Redis(url, {
        connectTimeout,
        commandTimeout,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times: number) => {
          if (times > 10) {
            this.logger.error('Redis: max retry attempts reached, giving up');
            return null; // Stop retrying
          }
          const delay = Math.min(times * 200, 2000);
          this.logger.warn(`Redis: retry attempt ${times}, waiting ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis: connected successfully');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.logger.log('Redis: ready to accept commands');
      });

      this.client.on('error', (err: Error) => {
        this.isConnected = false;
        // Only log non-connection errors to avoid log spam
        if (!err.message.includes('ECONNREFUSED')) {
          this.logger.error(`Redis error: ${err.message}`);
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis: connection closed');
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis: reconnecting...');
      });
    } catch (err: any) {
      this.logger.error(`Redis: failed to initialize client: ${err.message}`);
    }
  }

  // ─── Health check ─────────────────────────────────────────────────────────

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // ─── Core operations (fail gracefully) ───────────────────────────────────

  async get(key: string): Promise<string | null> {
    try {
      if (!this.client) return null;
      return await this.client.get(key);
    } catch (err: any) {
      this.logger.warn(`Redis GET failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.client) return false;
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (err: any) {
      this.logger.warn(`Redis SET failed for key "${key}": ${err.message}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.del(key);
      return true;
    } catch (err: any) {
      this.logger.warn(`Redis DEL failed for key "${key}": ${err.message}`);
      return false;
    }
  }

  async incr(key: string): Promise<number | null> {
    try {
      if (!this.client) return null;
      return await this.client.incr(key);
    } catch (err: any) {
      this.logger.warn(`Redis INCR failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.expire(key, ttlSeconds);
      return true;
    } catch (err: any) {
      this.logger.warn(`Redis EXPIRE failed for key "${key}": ${err.message}`);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.client) return -2;
      return await this.client.ttl(key);
    } catch {
      return -2;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client) return [];
      return await this.client.keys(pattern);
    } catch (err: any) {
      this.logger.warn(`Redis KEYS failed for pattern "${pattern}": ${err.message}`);
      return [];
    }
  }

  // ─── Rate limiting support ────────────────────────────────────────────────

  async incrWithExpire(key: string, ttlSeconds: number): Promise<number | null> {
    try {
      if (!this.client) return null;
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttlSeconds);
      const results = await pipeline.exec();
      if (!results) return null;
      return results[0][1] as number;
    } catch (err: any) {
      this.logger.warn(`Redis incrWithExpire failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  // ─── BullMQ configuration ─────────────────────────────────────────────────

  getQueueConnection() {
    const url = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    return { url };
  }

  getRedisConfig() {
    return {
      url: this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
    };
  }

  getQueueConfig(queueName: string) {
    this.logger.log(`Registered BullMQ queue: ${queueName}`);
    return {
      name: queueName,
      connection: this.getQueueConnection(),
    };
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      this.logger.log('Redis: disconnected gracefully');
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
