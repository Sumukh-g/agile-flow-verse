import { Controller, ForbiddenException, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAdminGuard } from '../common/guards/tenant-admin.guard';
import { MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAdminGuard)
@Controller('/v1/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('system')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved successfully' })
  async getSystemMetrics() {
    return this.monitoringService.getSystemMetrics();
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get tenant metrics' })
  @ApiResponse({ status: 200, description: 'Tenant metrics retrieved successfully' })
  async getTenantMetrics(@Param('tenantId') tenantId: string, @Request() req: any) {
    // Prevent cross-tenant access: admins may only read their own tenant.
    if (tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Cannot access metrics for another tenant');
    }
    return this.monitoringService.getTenantMetrics(tenantId);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics() {
    return this.monitoringService.getPerformanceMetrics();
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get error metrics' })
  @ApiResponse({ status: 200, description: 'Error metrics retrieved successfully' })
  async getErrorMetrics() {
    return this.monitoringService.getErrorMetrics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealthStatus() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    return this.monitoringService.getAuditLogs(req.user.tenantId, limit);
  }
}





