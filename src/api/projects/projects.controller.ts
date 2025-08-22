import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { decodeCursor } from '../common/pagination/cursor';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Post()
  async create(@Body() body: CreateProjectDto, @Request() req: any) {
    return this.svc.create(req.user.tenantId, req.user.userId, body);
  }

  @Get()
  async list(@Query('cursor') cursor?: string, @Query('limit') limit?: string, @Request() req?: any) {
    return this.svc.list(req.user.tenantId, decodeCursor(cursor), limit ? Number(limit) : 25);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Request() req: any) {
    return this.svc.get(req.user.tenantId, req.user.userId, id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateProjectDto, @Request() req: any) {
    return this.svc.update(req.user.tenantId, req.user.userId, id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.svc.remove(req.user.tenantId, req.user.userId, id);
  }
} 