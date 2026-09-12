import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { AppLoggerService } from './logger/app-logger.service';
import { CacheService } from './cache/cache.service';
import { MetricsService } from './metrics/metrics.service';
import { AuditLogService } from './audit/audit-log.service';
import { FeatureFlagsService } from './feature-flags/feature-flags.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    AppLoggerService,
    CacheService,
    MetricsService,
    AuditLogService,
    FeatureFlagsService,
  ],
  exports: [
    RedisService,
    AppLoggerService,
    CacheService,
    MetricsService,
    AuditLogService,
    FeatureFlagsService,
  ],
})
export class CommonModule {}
