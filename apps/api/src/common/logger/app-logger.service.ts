import { Injectable, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly sensitiveKeys = new Set([
    'password', 'passwordhash', 'token', 'accesstoken',
    'refreshtoken', 'apikey', 'authorization', 'cookie', 'secret'
  ]);

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sanitize(item));

    const sanitized = { ...obj };
    for (const [key, value] of Object.entries(sanitized)) {
      if (this.sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitize(value);
      }
    }
    return sanitized;
  }

  private formatLog(level: string, message: any, context?: any) {
    if (this.isProduction) {
      let contextObj = {};
      let contextStr = 'API';

      if (typeof context === 'object' && context !== null) {
        contextObj = context;
      } else if (typeof context === 'string') {
        contextStr = context;
      }

      const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: 'api',
        environment: 'production',
        message: msgStr,
        context: contextStr,
        ...this.sanitize(contextObj)
      });
    }
    return null;
  }

  log(message: any, context?: any) {
    if (this.isProduction) {
      console.log(this.formatLog('log', message, context));
    } else {
      super.log(message, typeof context === 'string' ? context : undefined);
    }
  }

  error(message: any, trace?: any, context?: any) {
    if (this.isProduction) {
      const additional = typeof context === 'object' ? context : { contextStr: context };
      console.error(this.formatLog('error', message, { trace, ...additional }));
    } else {
      super.error(message, typeof trace === 'string' ? trace : undefined, typeof context === 'string' ? context : undefined);
    }
  }

  warn(message: any, context?: any) {
    if (this.isProduction) {
      console.warn(this.formatLog('warn', message, context));
    } else {
      super.warn(message, typeof context === 'string' ? context : undefined);
    }
  }

  debug(message: any, context?: any) {
    if (this.isProduction) {
      console.debug(this.formatLog('debug', message, context));
    } else {
      super.debug(message, typeof context === 'string' ? context : undefined);
    }
  }
}
