import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
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
  constructor(private readonly svc: TasksService) {}

  @Post()
  async create(@Body() body: CreateTaskDto, req: any) {
    return this.svc.create(req.user.tenantId, req.user.userId, body);
  }

  @Get()
  async list(@Query('projectId') projectId?: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string, req?: any) {
    return this.svc.list(req.user.tenantId, projectId, decodeCursor(cursor), limit ? Number(limit) : 25);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTaskDto, req: any) {
    return this.svc.update(req.user.tenantId, req.user.userId, id, body);
  }
} 