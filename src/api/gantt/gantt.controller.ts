import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GanttService } from './gantt.service';

/**
 * Gantt Controller
 * Handles all Gantt chart API endpoints
 */
@ApiTags('gantt')
@Controller('v1/gantt')
@UseGuards(JwtAuthGuard)
export class GanttController {
  constructor(private readonly ganttService: GanttService) {}

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get all Gantt tasks for a project' })
  @ApiResponse({ status: 200, description: 'Gantt data retrieved successfully' })
  async getGanttData(@Param('projectId') projectId: string, @Request() req: any) {
    return this.ganttService.getGanttData(req.user.tenantId, req.user.userId, projectId);
  }

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create a new Gantt task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(@Param('projectId') projectId: string, @Body() dto: any, @Request() req: any) {
    return this.ganttService.createTask(req.user.tenantId, req.user.userId, projectId, dto);
  }

  @Put('projects/:projectId/tasks/:taskId')
  @ApiOperation({ summary: 'Update a Gantt task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.ganttService.updateTask(req.user.tenantId, req.user.userId, projectId, taskId, dto);
  }

  @Delete('projects/:projectId/tasks/:taskId')
  @ApiOperation({ summary: 'Delete a Gantt task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  async deleteTask(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @Request() req: any) {
    return this.ganttService.deleteTask(req.user.tenantId, req.user.userId, projectId, taskId);
  }

  @Put('projects/:projectId/tasks/:taskId/schedule')
  @ApiOperation({ summary: 'Update task schedule (dates)' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  async updateTaskSchedule(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: { startDate: string; endDate: string },
    @Request() req: any,
  ) {
    return this.ganttService.updateTaskSchedule(
      req.user.tenantId,
      req.user.userId,
      projectId,
      taskId,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  @Post('projects/:projectId/dependencies')
  @ApiOperation({ summary: 'Create a dependency between two tasks' })
  @ApiResponse({ status: 201, description: 'Dependency created successfully' })
  async createDependency(
    @Param('projectId') projectId: string,
    @Body() body: { fromTaskId: string; toTaskId: string; type?: string; lag?: number },
    @Request() req: any,
  ) {
    return this.ganttService.createDependency(
      req.user.tenantId,
      req.user.userId,
      projectId,
      body.fromTaskId,
      body.toTaskId,
      body.type,
      body.lag,
    );
  }

  @Delete('projects/:projectId/dependencies/:dependencyId')
  @ApiOperation({ summary: 'Delete a dependency' })
  @ApiResponse({ status: 200, description: 'Dependency deleted successfully' })
  async deleteDependency(
    @Param('projectId') projectId: string,
    @Param('dependencyId') dependencyId: string,
    @Request() req: any,
  ) {
    return this.ganttService.deleteDependency(req.user.tenantId, req.user.userId, projectId, dependencyId);
  }
}

