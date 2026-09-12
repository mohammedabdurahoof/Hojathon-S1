import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
    let requestId = req.header('X-Request-ID');

    // Validate alphanumeric + hyphens, max 64 chars
    if (!requestId || !/^[a-zA-Z0-9-]{1,64}$/.test(requestId)) {
      requestId = crypto.randomUUID();
    }

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
