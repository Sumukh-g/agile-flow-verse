import { Controller, Get, Query, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses } from '../common/swagger/swagger.decorators';
import { ReportsService, ReportConfig } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('burndown')
  @ApiOperation({
    summary: 'Generate burndown chart data',
    description: 'Generates burndown chart data for a project showing planned vs actual progress over time.',
  })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Grouping interval' })
  @ApiResponse({ status: 200, description: 'Burndown data retrieved successfully' })
  @ApiStandardResponses()
  async getBurndownReport(
    @Query('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
    @Request() req?: any,
  ) {
    const config: ReportConfig = {
      type: 'burndown',
      projectId,
      startDate,
      endDate,
      groupBy,
    };
    return this.reportsService.generateBurndownReport(req.user.tenantId, config);
  }

  @Get('velocity')
  @ApiOperation({
    summary: 'Generate velocity report',
    description: 'Generates sprint velocity data showing completed vs planned tasks per sprint.',
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Velocity data retrieved successfully' })
  @ApiStandardResponses()
  async getVelocityReport(
    @Query('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req?: any,
  ) {
    const config: ReportConfig = {
      type: 'velocity',
      projectId,
      startDate,
      endDate,
    };
    return this.reportsService.generateVelocityReport(req.user.tenantId, config);
  }

  @Get('capacity')
  @ApiOperation({
    summary: 'Generate capacity report',
    description: 'Generates team capacity and workload data showing assigned vs available hours per user.',
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Capacity data retrieved successfully' })
  @ApiStandardResponses()
  async getCapacityReport(
    @Query('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req?: any,
  ) {
    const config: ReportConfig = {
      type: 'capacity',
      projectId,
      startDate,
      endDate,
    };
    return this.reportsService.generateCapacityReport(req.user.tenantId, config);
  }

  @Get('time-tracking')
  @ApiOperation({
    summary: 'Generate time tracking report',
    description: 'Generates detailed time tracking report grouped by date, user, and project.',
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'includeDetails', required: false, type: Boolean, description: 'Include detailed entries' })
  @ApiResponse({ status: 200, description: 'Time tracking data retrieved successfully' })
  @ApiStandardResponses()
  async getTimeTrackingReport(
    @Query('projectId') projectId: string,
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('includeDetails') includeDetails?: boolean,
    @Request() req?: any,
  ) {
    const config: ReportConfig = {
      type: 'time-tracking',
      projectId,
      userId,
      startDate,
      endDate,
      includeDetails: includeDetails === true,
    };
    return this.reportsService.generateTimeTrackingReport(req.user.tenantId, config);
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export report',
    description: 'Exports a report in the specified format (CSV, JSON, or PDF).',
  })
  @ApiQuery({ name: 'type', required: true, enum: ['burndown', 'velocity', 'capacity', 'time-tracking'] })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'json', 'pdf'] })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  @ApiStandardResponses()
  async exportReport(
    @Query('type') type: string,
    @Query('format') format: 'csv' | 'json' | 'pdf',
    @Query('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
    @Request() req?: any,
  ) {
    const config: ReportConfig = {
      type: type as any,
      projectId,
      startDate,
      endDate,
    };

    let data: any;
    switch (type) {
      case 'burndown':
        data = await this.reportsService.generateBurndownReport(req.user.tenantId, config);
        break;
      case 'velocity':
        data = await this.reportsService.generateVelocityReport(req.user.tenantId, config);
        break;
      case 'capacity':
        data = await this.reportsService.generateCapacityReport(req.user.tenantId, config);
        break;
      case 'time-tracking':
        data = await this.reportsService.generateTimeTrackingReport(req.user.tenantId, config);
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    const exported = await this.reportsService.exportReport(req.user.tenantId, type, format, data);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
      res.send(exported);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.json"`);
      res.send(exported);
    } else {
      throw new Error('PDF export not yet implemented');
    }
  }
}

