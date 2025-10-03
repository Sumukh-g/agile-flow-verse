import { Body, Controller, Get, Inject, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { decodeCursor } from '../common/pagination/cursor';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/tasks')
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() body: CreateTaskDto, @Request() req: any) {
    return this.tasksService.create(req.user.tenantId, req.user.userId, body);
  }

  @Get()
  async list(@Query('projectId') projectId?: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string, @Request() req?: any) {
    return this.tasksService.list(req.user.tenantId, projectId, decodeCursor(cursor), limit ? Number(limit) : 25);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTaskDto, @Request() req: any) {
    return this.tasksService.update(req.user.tenantId, req.user.userId, id, body);
  }
}
