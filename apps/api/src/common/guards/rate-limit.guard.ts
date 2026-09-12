import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redisClient: Redis;
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly enabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.enabled = this.configService.get<string>('RATE_LIMIT_ENABLED', 'true') === 'true';
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Fail fast if Redis is down
    });
    
    this.redisClient.on('error', (err) => {
      this.logger.warn(`Redis connection error in RateLimitGuard: ${err.message}`);
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enabled) return true;

    const rateLimitMeta = this.reflector.get<{ limit: number; windowSeconds: number; keyBy: 'ip' | 'user' }>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitMeta) return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const identifier = rateLimitMeta.keyBy === 'user'
      ? (request.user?.id || request.ip)
      : request.ip;

    const endpoint = `${request.method}:${request.route?.path || request.url}`;
    const key = `rate_limit:${rateLimitMeta.keyBy}:${identifier}:${endpoint}`;

    try {
      const currentCount = await this.redisClient.incr(key);
      if (currentCount === 1) {
        await this.redisClient.expire(key, rateLimitMeta.windowSeconds);
      }

      if (currentCount > rateLimitMeta.limit) {
        response.header('Retry-After', rateLimitMeta.windowSeconds.toString());
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Fail open
      this.logger.warn(`Rate limit check failed for key ${key}, allowing request. Error: ${(error as Error).message}`);
      return true;
    }

    return true;
  }
}
