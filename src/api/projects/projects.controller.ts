import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { decodeCursor } from '../common/pagination/cursor';
import { AddProjectMemberDto, CreateProjectDto, UpdateProjectDto, UpdateProjectMemberRoleDto } from './dto';
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
    return this.svc.list(req.user.tenantId, req.user.userId, decodeCursor(cursor), limit ? Number(limit) : 25);
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

  @Get(':id/members')
  async getMembers(@Param('id') id: string, @Request() req: any) {
    return this.svc.getMembers(req.user.tenantId, req.user.userId, id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() body: AddProjectMemberDto,
    @Request() req: any,
  ) {
    return this.svc.addMember(req.user.tenantId, req.user.userId, id, body);
  }

  @Put(':id/members/:userId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: UpdateProjectMemberRoleDto,
    @Request() req: any,
  ) {
    return this.svc.updateMemberRole(req.user.tenantId, req.user.userId, id, userId, body.role);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.svc.removeMember(req.user.tenantId, req.user.userId, id, userId);
  }

  // Archive/Unarchive endpoints
  @Post(':id/archive')
  async archive(@Param('id') id: string, @Request() req: any) {
    return this.svc.archive(req.user.tenantId, req.user.userId, id);
  }

  @Post(':id/unarchive')
  async unarchive(@Param('id') id: string, @Request() req: any) {
    return this.svc.unarchive(req.user.tenantId, req.user.userId, id);
  }

  // Restore from bin
  @Post(':id/restore')
  async restore(@Param('id') id: string, @Request() req: any) {
    return this.svc.restore(req.user.tenantId, req.user.userId, id);
  }

  // Permanent delete from bin
  @Delete(':id/permanent')
  async permanentDelete(@Param('id') id: string, @Request() req: any) {
    return this.svc.permanentDelete(req.user.tenantId, req.user.userId, id);
  }

  // Bulk operations
  @Post('bulk/delete')
  async bulkDelete(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.svc.bulkDelete(req.user.tenantId, req.user.userId, body.ids);
  }

  @Post('bulk/archive')
  async bulkArchive(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.svc.bulkArchive(req.user.tenantId, req.user.userId, body.ids);
  }

  @Post('bulk/unarchive')
  async bulkUnarchive(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.svc.bulkUnarchive(req.user.tenantId, req.user.userId, body.ids);
  }

  // List deleted projects (bin)
  @Get('deleted')
  async listDeleted(@Request() req: any) {
    return this.svc.listDeleted(req.user.tenantId, req.user.userId);
  }
} 