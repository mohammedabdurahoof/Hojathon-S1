import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    
    const method = req.method;
    const url = req.url;
    const requestId = req.requestId;
    const userId = req.user?.id;
    const now = Date.now();

    this.logger.log(`Request started ${method} ${url}`, { method, url, requestId, userId });

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - now;
        const statusCode = res.statusCode;
        this.logger.log(`Request completed ${method} ${url} - ${statusCode}`, { 
          method, 
          url, 
          statusCode, 
          durationMs, 
          requestId, 
          userId 
        });
      }),
    );
  }
}
