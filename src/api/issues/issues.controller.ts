import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto, IssueQueryDto, CreateIssueCommentDto } from './dto';

@ApiTags('Issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/issues')
export class IssuesController {
  constructor(private readonly svc: IssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new issue' })
  @ApiResponse({ status: 201, description: 'Issue created successfully' })
  async create(@Body() data: CreateIssueDto, @Request() req: any) {
    return this.svc.create(req.user.tenantId, req.user.userId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List issues' })
  @ApiResponse({ status: 200, description: 'List of issues' })
  async list(@Query() query: IssueQueryDto, @Request() req: any) {
    return this.svc.list(req.user.tenantId, req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  @ApiResponse({ status: 200, description: 'Issue details' })
  async get(@Param('id') id: string, @Request() req: any) {
    return this.svc.get(req.user.tenantId, req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update issue' })
  @ApiResponse({ status: 200, description: 'Issue updated successfully' })
  async update(@Param('id') id: string, @Body() data: UpdateIssueDto, @Request() req: any) {
    return this.svc.update(req.user.tenantId, req.user.userId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete issue' })
  @ApiResponse({ status: 200, description: 'Issue deleted successfully' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(req.user.tenantId, req.user.userId, id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to issue' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  async addComment(@Param('id') issueId: string, @Body() data: CreateIssueCommentDto, @Request() req: any) {
    return this.svc.addComment(req.user.tenantId, req.user.userId, issueId, data);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get issue comments' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  async getComments(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.getComments(req.user.tenantId, req.user.userId, issueId);
  }
}

