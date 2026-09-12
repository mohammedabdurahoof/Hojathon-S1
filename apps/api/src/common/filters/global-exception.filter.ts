import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErrorCode } from '../constants/error-codes';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = AppErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody: any = exception.getResponse();
      message = typeof responseBody === 'string' ? responseBody : (responseBody.message || exception.message);
      
      if (responseBody && typeof responseBody === 'object' && responseBody.code) {
        code = responseBody.code;
      } else if (status === HttpStatus.UNAUTHORIZED) {
        code = AppErrorCode.AUTHENTICATION_FAILED;
      } else if (status === HttpStatus.FORBIDDEN) {
        code = AppErrorCode.AUTHORIZATION_DENIED;
      } else if (status === HttpStatus.NOT_FOUND) {
        code = AppErrorCode.RESOURCE_NOT_FOUND;
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        code = AppErrorCode.RATE_LIMIT_EXCEEDED;
      } else {
        code = AppErrorCode.BAD_REQUEST;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      code = AppErrorCode.DATABASE_ERROR;
      message = 'Database constraint violation or error';
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'name' in exception
    ) {
      const name = (exception as any).name;
      if (name === 'ZodError') {
        status = HttpStatus.BAD_REQUEST;
        code = AppErrorCode.VALIDATION_ERROR;
        message = 'Validation failed';
        details = (exception as any).errors;
      } else if (name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        code = AppErrorCode.VALIDATION_ERROR;
        message = 'Validation failed';
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';

    this.logger.error(
      `[${requestId || 'no-req-id'}] ${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
      { requestId, method: request.method, url: request.url }
    );

    const errorResponse: any = {
      success: false,
      error: {
        code,
        message,
        requestId,
      },
    };

    if (!isProduction) {
      errorResponse.error.details = details || (exception instanceof Error ? exception.message : String(exception));
    }

    response.status(status).json(errorResponse);
  }
}
