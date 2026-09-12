import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export const RateLimit = (limit: number, windowSeconds: number, keyBy: 'ip' | 'user' = 'user') =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds, keyBy });
