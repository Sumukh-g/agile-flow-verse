import { Body, Controller, Get, Param, Post, Put, Delete, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { decodeCursor } from '../common/pagination/cursor';
import { CreateNoteDto } from './dto';
import { NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/notes')
export class NotesController {
  constructor(private readonly svc: NotesService) {}

  @Post()
  async create(@Body() body: CreateNoteDto, @Request() req: any) {
    return this.svc.create(req.user.tenantId, req.user.userId, body);
  }

  @Get()
  async list(@Query('projectId') projectId: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string, @Request() req?: any) {
    return this.svc.list(req.user.tenantId, projectId, decodeCursor(cursor), limit ? Number(limit) : 25);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Request() req: any) {
    return this.svc.get(req.user.tenantId, req.user.userId, id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.update(req.user.tenantId, req.user.userId, id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(req.user.tenantId, req.user.userId, id);
  }
} 