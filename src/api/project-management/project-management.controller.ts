import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses, ApiIdParam } from '../common/swagger/swagger.decorators';
import { GanttService } from './gantt.service';
import { ResourceManagementService } from './resource-management.service';

@ApiTags('project-management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/project-management')
export class ProjectManagementController {
  constructor(
    private readonly ganttService: GanttService,
    private readonly resourceService: ResourceManagementService,
  ) {}

  @Get('gantt/:projectId')
  @ApiOperation({
    summary: 'Get Gantt chart data',
    description: 'Retrieves Gantt chart data including tasks, dependencies, and critical path for a project.',
  })
  @ApiIdParam('Project ID')
  @ApiResponse({ status: 200, description: 'Gantt data retrieved successfully' })
  @ApiStandardResponses()
  async getGanttData(@Param('projectId') projectId: string, @Request() req: any) {
    return this.ganttService.getGanttData(req.user.tenantId, projectId);
  }

  @Put('gantt/:projectId/tasks/:taskId/schedule')
  @ApiOperation({
    summary: 'Update task schedule',
    description: 'Updates task start and end dates, automatically adjusting dependent tasks.',
  })
  @ApiIdParam('Project ID')
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiStandardResponses()
  async updateTaskSchedule(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: { startDate: string; endDate: string },
    @Request() req: any,
  ) {
    return this.ganttService.updateTaskSchedule(
      req.user.tenantId,
      projectId,
      taskId,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  @Post('gantt/:projectId/optimize')
  @ApiOperation({
    summary: 'Optimize project schedule',
    description: 'Analyzes project schedule and provides optimization suggestions.',
  })
  @ApiIdParam('Project ID')
  @ApiResponse({ status: 200, description: 'Optimization suggestions generated' })
  @ApiStandardResponses()
  async optimizeSchedule(@Param('projectId') projectId: string, @Request() req: any) {
    return this.ganttService.optimizeSchedule(req.user.tenantId, projectId);
  }

  @Get('resources/allocations')
  @ApiOperation({
    summary: 'Get resource allocations',
    description: 'Retrieves resource allocation data including workload, utilization, and conflicts.',
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiResponse({ status: 200, description: 'Resource allocations retrieved successfully' })
  @ApiStandardResponses()
  async getResourceAllocations(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
    return this.resourceService.getResourceAllocations(
      req.user.tenantId,
      new Date(startDate),
      new Date(endDate),
      projectId,
    );
  }

  @Get('resources/suggest/:taskId')
  @ApiOperation({
    summary: 'Suggest resources for task',
    description: 'Suggests best resources to assign to a task based on availability and experience.',
  })
  @ApiIdParam('Task ID')
  @ApiQuery({ name: 'skills', required: false, description: 'Required skills (comma-separated)' })
  @ApiResponse({ status: 200, description: 'Resource suggestions generated' })
  @ApiStandardResponses()
  async suggestResources(
    @Param('taskId') taskId: string,
    @Query('skills') skills: string,
    @Request() req: any,
  ) {
    const skillArray = skills ? skills.split(',') : undefined;
    return this.resourceService.suggestResources(req.user.tenantId, taskId, skillArray);
  }

  @Post('resources/balance')
  @ApiOperation({
    summary: 'Balance workload',
    description: 'Analyzes team workload and suggests task reallocation to balance work distribution.',
  })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Workload balance suggestions generated' })
  @ApiStandardResponses()
  async balanceWorkload(
    @Query('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.resourceService.balanceWorkload(
      req.user.tenantId,
      projectId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('resources/:userId/availability')
  @ApiOperation({
    summary: 'Get resource availability',
    description: 'Retrieves availability information for a specific user in a date range.',
  })
  @ApiIdParam('User ID')
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Resource availability retrieved successfully' })
  @ApiStandardResponses()
  async getResourceAvailability(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.resourceService.getResourceAvailability(
      req.user.tenantId,
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}

