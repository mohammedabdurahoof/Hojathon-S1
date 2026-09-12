import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

/**
 * Admin controller — all routes require AdminGuard.
 * Never expose to students or unauthenticated users.
 */
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /api/admin/version
   * Application version and build information.
   */
  @Get('version')
  @ApiOperation({ summary: 'Get application version and build info (admin only)' })
  @ApiResponse({ status: 200, description: 'Version information' })
  getVersion() {
    return this.adminService.getVersion();
  }

  /**
   * GET /api/version
   * Duplicate at root level for convenience (non-admin — safe info only).
   * Exposed at /api/version not /api/admin/version for backwards compatibility.
   */

  /**
   * GET /api/admin/metrics
   * System metrics — memory, CPU, request counts.
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics (admin only)' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  getMetrics() {
    return this.adminService.getSystemMetrics();
  }

  /**
   * GET /api/admin/queue/metrics
   * BullMQ queue depth and statistics.
   */
  @Get('queue/metrics')
  @ApiOperation({ summary: 'Get queue metrics for all queues (admin only)' })
  @ApiResponse({ status: 200, description: 'Queue metrics' })
  async getQueueMetrics() {
    return this.adminService.getQueueMetrics();
  }

  /**
   * GET /api/admin/jobs/failed
   * View failed background jobs.
   */
  @Get('jobs/failed')
  @ApiOperation({ summary: 'List failed background jobs (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Failed jobs list' })
  async getFailedJobs(@Query('limit') limit = 50) {
    return this.adminService.getFailedJobs(Math.min(Number(limit), 200));
  }

  /**
   * POST /api/admin/jobs/:id/retry
   * Retry a specific failed job.
   */
  @Post('jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed background job (admin only)' })
  @ApiResponse({ status: 200, description: 'Job queued for retry' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(@Param('id') id: string) {
    // Placeholder — in production, use BullMQ Job.retry()
    return { success: true, message: `Job ${id} queued for retry` };
  }

  /**
   * GET /api/admin/feature-flags
   * Current feature flag states.
   */
  @Get('feature-flags')
  @ApiOperation({ summary: 'Get current feature flag states (admin only)' })
  @ApiResponse({ status: 200, description: 'Feature flags' })
  getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }
}
