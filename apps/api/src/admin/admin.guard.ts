import { Injectable, Logger, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * AdminGuard — requires ADMIN role OR a valid admin API key in X-Admin-Key header.
 * Only for internal/admin endpoints. Never expose to students.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
  private readonly adminApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.adminApiKey = this.configService.get<string>('ADMIN_API_KEY', '');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // Allow authenticated ADMIN role users
    if (user && user.role === 'ADMIN') {
      return true;
    }

    // Allow requests with valid admin API key (for internal services/scripts)
    const apiKey = request.headers['x-admin-key'] as string;
    if (this.adminApiKey && apiKey === this.adminApiKey) {
      return true;
    }

    this.logger.warn(
      `Admin access denied — userId: ${user?.id || 'unauthenticated'}, ` +
      `route: ${request.method} ${request.path}`,
    );
    throw new UnauthorizedException('Admin access required');
  }
}
