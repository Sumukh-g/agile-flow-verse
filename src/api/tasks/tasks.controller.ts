import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses, ApiIdParam, ApiPaginationQuery } from '../common/swagger/swagger.decorators';
import { decodeCursor } from '../common/pagination/cursor';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new task',
    description: 'Creates a new task in a project. Supports task dependencies and assignees.'
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1234567890abcdef' },
        title: { type: 'string', example: 'Implement user authentication' },
        status: { type: 'string', example: 'todo' },
        priority: { type: 'string', example: 'medium' },
        projectId: { type: 'string', example: 'proj123' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiStandardResponses()
  async create(@Body() body: CreateTaskDto, @Request() req: any) {
    return this.svc.create(req.user.tenantId, req.user.userId, body);
  }

  @Get()
  @ApiOperation({ 
    summary: 'List tasks',
    description: 'Retrieves a paginated list of tasks. Can be filtered by project ID.'
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter tasks by project ID',
    type: String,
  })
  @ApiPaginationQuery()
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/Task' },
        },
        nextCursor: { type: 'string', nullable: true },
      },
    },
  })
  @ApiStandardResponses()
  async list(
    @Query('projectId') projectId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    return this.svc.list(req.user.tenantId, projectId, decodeCursor(cursor), limit ? Number(limit) : 25);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get task by ID',
    description: 'Retrieves a single task by its ID including all relationships.'
  })
  @ApiIdParam('Task ID')
  @ApiResponse({
    status: 200,
    description: 'Task retrieved successfully',
    schema: { $ref: '#/components/schemas/Task' },
  })
  @ApiStandardResponses()
  async get(@Param('id') id: string, @Request() req: any) {
    return this.svc.get(req.user.tenantId, req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update a task',
    description: 'Updates an existing task. Only provided fields will be updated.'
  })
  @ApiIdParam('Task ID')
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    schema: { $ref: '#/components/schemas/Task' },
  })
  @ApiStandardResponses()
  async update(@Param('id') id: string, @Body() body: UpdateTaskDto, @Request() req: any) {
    return this.svc.update(req.user.tenantId, req.user.userId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete a task',
    description: 'Permanently deletes a task and all its relationships.'
  })
  @ApiIdParam('Task ID')
  @ApiResponse({
    status: 200,
    description: 'Task deleted successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
      },
    },
  })
  @ApiStandardResponses()
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(req.user.tenantId, req.user.userId, id);
  }
} 