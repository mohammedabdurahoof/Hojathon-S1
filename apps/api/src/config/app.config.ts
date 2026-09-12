import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  appEnv: string;
  port: number;
  version: string;
  commit: string;
}

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
}

export interface RedisConfig {
  url: string;
  maxConnections: number;
  connectTimeout: number;
  commandTimeout: number;
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessTokenExpires: string;
  refreshTokenExpires: string;
}

export interface AiConfig {
  provider: string;
  apiKey: string;
  model: string;
  embeddingModel: string;
  requestTimeoutMs: number;
  maxTokens: number;
  maxContextTokens: number;
  rateLimitPerMinute: number;
  dailyTokenLimit: number;
  maxSessionMessages: number;
}

export interface StorageConfig {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  backupBucket: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  auth: { limit: number; windowSeconds: number };
  general: { limit: number; windowSeconds: number };
  ai: { limit: number; windowSeconds: number };
  assessment: { limit: number; windowSeconds: number };
  upload: { limit: number; windowSeconds: number };
}

export interface QueueConfig {
  concurrency: number;
  workerConcurrency: number;
  jobTimeoutMs: number;
  maxAttempts: number;
  backoffDelayMs: number;
}

export interface CacheConfig {
  ttl: number;
  ttlLong: number;
  ttlShort: number;
}

export interface FeatureFlagsConfig {
  aiTutorEnabled: boolean;
  aiPracticeEnabled: boolean;
  aiAssessmentGenerationEnabled: boolean;
  ragEnabled: boolean;
  adaptiveAssessmentEnabled: boolean;
  teacherAiEnabled: boolean;
  maintenanceMode: boolean;
}

export interface ObservabilityConfig {
  sentryDsn: string;
  sentryEnvironment: string;
  sentryTracesSampleRate: number;
  logLevel: string;
}

export const appConfig = registerAs('app', (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  appEnv: process.env.APP_ENV || 'development',
  port: parseInt(process.env.API_PORT || process.env.PORT || '3001', 10),
  version: process.env.APP_VERSION || '0.0.0',
  commit: process.env.APP_COMMIT || 'unknown',
}));

export const databaseConfig = registerAs('database', (): DatabaseConfig => ({
  url: process.env.DATABASE_URL || '',
  poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
}));

export const redisConfig = registerAs('redis', (): RedisConfig => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS || '20', 10),
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
}));

export const jwtConfig = registerAs('jwt', (): JwtConfig => ({
  secret: process.env.JWT_SECRET || '',
  refreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessTokenExpires: process.env.JWT_ACCESS_TOKEN_EXPIRES || '15m',
  refreshTokenExpires: process.env.JWT_REFRESH_TOKEN_EXPIRES || '7d',
}));

export const aiConfig = registerAs('ai', (): AiConfig => ({
  provider: process.env.AI_PROVIDER || 'mock',
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  embeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
  requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '30000', 10),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
  maxContextTokens: parseInt(process.env.AI_MAX_CONTEXT_TOKENS || '8000', 10),
  rateLimitPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '20', 10),
  dailyTokenLimit: parseInt(process.env.AI_DAILY_TOKEN_LIMIT || '1000000', 10),
  maxSessionMessages: parseInt(process.env.AI_MAX_SESSION_MESSAGES || '50', 10),
}));

export const storageConfig = registerAs('storage', (): StorageConfig => ({
  endpoint: process.env.S3_ENDPOINT || '',
  bucket: process.env.S3_BUCKET || '',
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
  region: process.env.S3_REGION || 'us-east-1',
  backupBucket: process.env.BACKUP_S3_BUCKET || '',
}));

export const rateLimitConfig = registerAs('rateLimit', (): RateLimitConfig => ({
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  auth: {
    limit: parseInt(process.env.AUTH_RATE_LIMIT || '10', 10),
    windowSeconds: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900', 10),
  },
  general: {
    limit: parseInt(process.env.GENERAL_RATE_LIMIT || '100', 10),
    windowSeconds: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW || '60', 10),
  },
  ai: {
    limit: parseInt(process.env.AI_RATE_LIMIT || '20', 10),
    windowSeconds: parseInt(process.env.AI_RATE_LIMIT_WINDOW || '60', 10),
  },
  assessment: {
    limit: parseInt(process.env.ASSESSMENT_RATE_LIMIT || '60', 10),
    windowSeconds: parseInt(process.env.ASSESSMENT_RATE_LIMIT_WINDOW || '60', 10),
  },
  upload: {
    limit: parseInt(process.env.UPLOAD_RATE_LIMIT || '10', 10),
    windowSeconds: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW || '3600', 10),
  },
}));

export const queueConfig = registerAs('queue', (): QueueConfig => ({
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
  jobTimeoutMs: parseInt(process.env.QUEUE_JOB_TIMEOUT_MS || '120000', 10),
  maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3', 10),
  backoffDelayMs: parseInt(process.env.QUEUE_BACKOFF_DELAY_MS || '5000', 10),
}));

export const cacheConfig = registerAs('cache', (): CacheConfig => ({
  ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  ttlLong: parseInt(process.env.CACHE_TTL_LONG || '3600', 10),
  ttlShort: parseInt(process.env.CACHE_TTL_SHORT || '60', 10),
}));

export const featureFlagsConfig = registerAs('featureFlags', (): FeatureFlagsConfig => ({
  aiTutorEnabled: process.env.AI_TUTOR_ENABLED !== 'false',
  aiPracticeEnabled: process.env.AI_PRACTICE_ENABLED !== 'false',
  aiAssessmentGenerationEnabled: process.env.AI_ASSESSMENT_GENERATION_ENABLED !== 'false',
  ragEnabled: process.env.RAG_ENABLED !== 'false',
  adaptiveAssessmentEnabled: process.env.ADAPTIVE_ASSESSMENT_ENABLED !== 'false',
  teacherAiEnabled: process.env.TEACHER_AI_ENABLED !== 'false',
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
}));

export const observabilityConfig = registerAs('observability', (): ObservabilityConfig => ({
  sentryDsn: process.env.SENTRY_DSN || '',
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  sentryTracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  logLevel: process.env.LOG_LEVEL || 'info',
}));

/**
 * Production environment validation.
 * Called at bootstrap — fails fast if required secrets are missing in production.
 */
export function validateProductionConfig(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  const required: Array<{ key: string; minLength?: number; message: string }> = [
    { key: 'DATABASE_URL', message: 'DATABASE_URL is required in production' },
    { key: 'REDIS_URL', message: 'REDIS_URL is required in production' },
    {
      key: 'JWT_SECRET',
      minLength: 32,
      message: 'JWT_SECRET must be at least 32 characters in production',
    },
    {
      key: 'JWT_REFRESH_SECRET',
      minLength: 32,
      message: 'JWT_REFRESH_SECRET must be at least 32 characters in production',
    },
    { key: 'CORS_ORIGINS', message: 'CORS_ORIGINS must be explicitly configured in production' },
    { key: 'ADMIN_API_KEY', message: 'ADMIN_API_KEY is required in production' },
  ];

  const errors: string[] = [];

  for (const rule of required) {
    const value = process.env[rule.key];
    if (!value || value.trim() === '') {
      errors.push(`MISSING: ${rule.key} — ${rule.message}`);
      continue;
    }
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`INSECURE: ${rule.key} — ${rule.message} (got ${value.length} chars)`);
    }
  }

  // Check for insecure placeholder secrets in production
  const insecurePatterns = ['CHANGE_ME', 'your_', 'placeholder', 'example', 'test_', 'dev_'];
  const secretKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'AI_API_KEY', 'ADMIN_API_KEY'];
  for (const key of secretKeys) {
    const value = process.env[key] || '';
    if (insecurePatterns.some((p) => value.toLowerCase().includes(p.toLowerCase()))) {
      errors.push(`INSECURE: ${key} appears to contain a placeholder value. Replace before production.`);
    }
  }

  if (errors.length > 0) {
    console.error('\n🚫 PRODUCTION CONFIGURATION ERRORS:\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    console.error('\nFix these issues before starting in production mode.\n');
    process.exit(1);
  }
}

export const allConfigs = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  aiConfig,
  storageConfig,
  rateLimitConfig,
  queueConfig,
  cacheConfig,
  featureFlagsConfig,
  observabilityConfig,
];
