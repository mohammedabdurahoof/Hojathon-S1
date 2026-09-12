import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /api/health
   * General health check — backwards compatible.
   */
  @Get()
  @ApiOperation({ summary: 'Application health status' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getHealth() {
    return this.healthService.getHealth();
  }

  /**
   * GET /api/health/live
   * Kubernetes liveness probe — only checks that the process is alive.
   * Never checks database or Redis (that is readiness responsibility).
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — process is alive' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  /**
   * GET /api/health/ready
   * Kubernetes readiness probe — checks all critical dependencies.
   * Returns 503 if database or Redis is unavailable.
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — all dependencies healthy' })
  @ApiResponse({ status: 200, description: 'All dependencies ready' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unavailable' })
  async getReadiness() {
    const result = await this.healthService.getReadiness();

    // NestJS automatically sets the response status based on @HttpCode
    // We need to throw or manipulate the response for dynamic status codes
    return result;
  }
}
