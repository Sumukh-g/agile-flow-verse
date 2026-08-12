import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses } from '../common/swagger/swagger.decorators';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { AnalyticsService } from './analytics.service';
import { EnhancedAnalyticsService } from './enhanced-analytics.service';
import { AnalyticsQueryDto } from './dto';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly enhancedAnalyticsService: EnhancedAnalyticsService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /** Enforce project read access when an analytics query is scoped to a project. */
  private async ensureProjectAccess(req: any, projectId?: string) {
    if (projectId) {
      await this.permissions.ensureCanReadProject(req.user.tenantId, req.user.userId, projectId);
    }
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get project analytics' })
  @ApiResponse({ status: 200, description: 'Project analytics retrieved successfully' })
  async getProjectAnalytics(
    @Param('projectId') projectId: string,
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    await this.ensureProjectAccess(req, projectId);
    return this.analyticsService.getProjectAnalytics(
      req.user.tenantId,
      projectId,
      query,
    );
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get task analytics' })
  @ApiResponse({ status: 200, description: 'Task analytics retrieved successfully' })
  async getTaskAnalytics(@Query() query: AnalyticsQueryDto, @Request() req: any) {
    return this.analyticsService.getTaskAnalytics(req.user.tenantId, query);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics(
    @Param('userId') userId: string,
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getUserAnalytics(
      req.user.tenantId,
      userId,
      query,
    );
  }

  @Get('tenant')
  @ApiOperation({ summary: 'Get tenant analytics' })
  @ApiResponse({ status: 200, description: 'Tenant analytics retrieved successfully' })
  async getTenantAnalytics(@Query() query: AnalyticsQueryDto, @Request() req: any) {
    return this.analyticsService.getTenantAnalytics(req.user.tenantId, query);
  }

  @Get('performance')
  @ApiOperation({ 
    summary: 'Get performance metrics',
    description: 'Get advanced performance metrics including cycle time, lead time, throughput, and WIP.'
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiStandardResponses()
  async getPerformanceMetrics(
    @Query('projectId') projectId: string,
    @Query('days') days: number,
    @Request() req: any,
  ) {
    await this.ensureProjectAccess(req, projectId);
    return this.enhancedAnalyticsService.getPerformanceMetrics(
      req.user.tenantId,
      projectId,
      days || 30,
    );
  }

  @Get('trends')
  @ApiOperation({ 
    summary: 'Get trend data',
    description: 'Get trend data over time for tasks, projects, completion rate, or velocity.'
  })
  @ApiQuery({ name: 'metric', required: true, enum: ['tasks', 'projects', 'completion', 'velocity'] })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Grouping interval' })
  @ApiResponse({ status: 200, description: 'Trend data retrieved successfully' })
  @ApiStandardResponses()
  async getTrendData(
    @Query('metric') metric: 'tasks' | 'projects' | 'completion' | 'velocity',
    @Query('projectId') projectId: string,
    @Query('days') days: number,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month',
    @Request() req: any,
  ) {
    await this.ensureProjectAccess(req, projectId);
    return this.enhancedAnalyticsService.getTrendData(
      req.user.tenantId,
      metric,
      projectId,
      days || 30,
      groupBy || 'day',
    );
  }

  @Get('workload')
  @ApiOperation({ 
    summary: 'Get workload analysis',
    description: 'Get workload analysis for all team members showing assigned tasks, hours, and workload percentage.'
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiResponse({ status: 200, description: 'Workload data retrieved successfully' })
  @ApiStandardResponses()
  async getWorkloadAnalysis(
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
    await this.ensureProjectAccess(req, projectId);
    return this.enhancedAnalyticsService.getWorkloadAnalysis(
      req.user.tenantId,
      projectId,
    );
  }

  @Get('forecast')
  @ApiOperation({ 
    summary: 'Get project forecast',
    description: 'Get predicted completion date and risk assessment for a project.'
  })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'targetDate', required: true, description: 'Target completion date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Forecast data retrieved successfully' })
  @ApiStandardResponses()
  async getForecast(
    @Query('projectId') projectId: string,
    @Query('targetDate') targetDate: string,
    @Request() req: any,
  ) {
    await this.ensureProjectAccess(req, projectId);
    return this.enhancedAnalyticsService.getForecast(
      req.user.tenantId,
      projectId,
      targetDate,
    );
  }
}





