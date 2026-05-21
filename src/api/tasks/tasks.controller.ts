import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses, ApiIdParam, ApiPaginationQuery } from '../common/swagger/swagger.decorators';
import { ZodValidationPipe, createZodValidationPipe } from '../common/validation/zod-validation.pipe';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  CreateTaskDtoSchema,
  UpdateTaskDtoSchema,
  TaskQueryDtoSchema,
  AuthenticatedRequest,
} from '../../shared/types';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Post()
  @UsePipes(createZodValidationPipe(CreateTaskDtoSchema))
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
  async create(
    @Body() body: CreateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.create(req.user.tenantId, req.user.userId, body);
  }

  @Get()
  @UsePipes(createZodValidationPipe(TaskQueryDtoSchema))
  @ApiOperation({ 
    summary: 'List tasks',
    description: 'Retrieves a paginated list of tasks. Can be filtered by project ID, status, priority, assignee, and tags.'
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter tasks by project ID (use "personal" for tasks without a project)',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by task status',
    enum: ['todo', 'in-progress', 'review', 'done', 'blocked', 'cancelled'],
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    description: 'Filter by task priority',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @ApiQuery({
    name: 'assigneeId',
    required: false,
    description: 'Filter by assignee user ID',
    type: String,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
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
        hasMore: { type: 'boolean' },
      },
    },
  })
  @ApiStandardResponses()
  async list(
    @Query() query: TaskQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.list(req.user.tenantId, req.user.userId, query);
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
  async get(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.get(req.user.tenantId, req.user.userId, id);
  }

  @Put(':id')
  @UsePipes(createZodValidationPipe(UpdateTaskDtoSchema))
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
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
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
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.delete(req.user.tenantId, req.user.userId, id);
  }

  @Get(':id/subtasks')
  @ApiOperation({ 
    summary: 'Get subtasks for a task',
    description: 'Retrieves all subtasks (child tasks) for a given task.'
  })
  @ApiIdParam('Task ID')
  @ApiResponse({
    status: 200,
    description: 'Subtasks retrieved successfully',
  })
  @ApiStandardResponses()
  async getSubtasks(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.getSubtasks(req.user.tenantId, req.user.userId, id);
  }

  @Get(':id/progress')
  @ApiOperation({ 
    summary: 'Calculate task progress',
    description: 'Calculates the progress percentage (0-100) based on completed subtasks.'
  })
  @ApiIdParam('Task ID')
  @ApiResponse({
    status: 200,
    description: 'Progress calculated successfully',
    schema: {
      type: 'object',
      properties: {
        progress: { type: 'number', example: 75 },
      },
    },
  })
  @ApiStandardResponses()
  async calculateProgress(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const progress = await this.svc.calculateProgress(req.user.tenantId, req.user.userId, id);
    return { progress };
  }

  @Get(':id/dependencies/blocking')
  @ApiOperation({ 
    summary: 'Check dependency blocking',
    description: 'Checks if a task is blocked by incomplete dependencies.'
  })
  @ApiIdParam('Task ID')
  @ApiResponse({
    status: 200,
    description: 'Blocking status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isBlocked: { type: 'boolean', example: true },
        blockingDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiStandardResponses()
  async checkDependencyBlocking(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.checkDependencyBlocking(req.user.tenantId, req.user.userId, id);
  }

  @Get(':id/dependencies')
  @ApiOperation({ 
    summary: 'Get task dependencies',
    description: 'Retrieves all dependencies for a task (blocks and blocked by).'
  })
  @ApiIdParam('Task ID')
  @ApiResponse({
    status: 200,
    description: 'Dependencies retrieved successfully',
  })
  @ApiStandardResponses()
  async getDependencies(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.getDependencies(req.user.tenantId, req.user.userId, id);
  }

  @Post('dependencies')
  @ApiOperation({ 
    summary: 'Add task dependency',
    description: 'Creates a dependency between two tasks. Circular dependencies are prevented.'
  })
  @ApiResponse({
    status: 201,
    description: 'Dependency created successfully',
  })
  @ApiStandardResponses()
  async addDependency(
    @Body() body: { fromTaskId: string; toTaskId: string },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.addDependency(req.user.tenantId, req.user.userId, body.fromTaskId, body.toTaskId);
  }

  @Delete('dependencies/:id')
  @ApiOperation({ 
    summary: 'Remove task dependency',
    description: 'Removes a dependency between tasks.'
  })
  @ApiIdParam('Dependency ID')
  @ApiResponse({
    status: 200,
    description: 'Dependency removed successfully',
  })
  @ApiStandardResponses()
  async removeDependency(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.removeDependency(req.user.tenantId, req.user.userId, id);
  }
} 