import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto, IssueQueryDto, CreateIssueCommentDto, CreateIssueLinkDto, DeleteIssueLinkDto } from './dto';

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

  @Put(':id/status')
  @ApiOperation({ summary: 'Update issue status (fast endpoint for board drag-and-drop)' })
  @ApiResponse({ status: 200, description: 'Issue status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; assigneeId?: string },
    @Request() req: any
  ) {
    return this.svc.updateStatus(req.user.tenantId, req.user.userId, id, body.status, body.assigneeId);
  }

  // ============================================
  // Phase 8: Issue Links
  // ============================================

  @Post(':id/links')
  @ApiOperation({ summary: 'Create a link to another issue' })
  @ApiResponse({ status: 201, description: 'Link created successfully' })
  async createLink(@Param('id') issueId: string, @Body() data: CreateIssueLinkDto, @Request() req: any) {
    return this.svc.createLink(req.user.tenantId, req.user.userId, issueId, data);
  }

  @Get(':id/links')
  @ApiOperation({ summary: 'Get all links for an issue' })
  @ApiResponse({ status: 200, description: 'List of links' })
  async getLinks(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.getLinks(req.user.tenantId, req.user.userId, issueId);
  }

  @Delete(':id/links/:linkId')
  @ApiOperation({ summary: 'Delete an issue link' })
  @ApiResponse({ status: 200, description: 'Link deleted successfully' })
  async deleteLink(@Param('id') issueId: string, @Param('linkId') linkId: string, @Request() req: any) {
    return this.svc.deleteLink(req.user.tenantId, req.user.userId, issueId, linkId);
  }

  // ============================================
  // Phase 8: Issue Watchers
  // ============================================

  @Get(':id/watchers')
  @ApiOperation({ summary: 'Get watchers for an issue' })
  @ApiResponse({ status: 200, description: 'List of watchers' })
  async getWatchers(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.getWatchers(req.user.tenantId, req.user.userId, issueId);
  }

  @Post(':id/watch')
  @ApiOperation({ summary: 'Watch an issue (receive notifications)' })
  @ApiResponse({ status: 200, description: 'Now watching the issue' })
  async watch(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.watch(req.user.tenantId, req.user.userId, issueId);
  }

  @Delete(':id/watch')
  @ApiOperation({ summary: 'Unwatch an issue (stop notifications)' })
  @ApiResponse({ status: 200, description: 'Stopped watching the issue' })
  async unwatch(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.unwatch(req.user.tenantId, req.user.userId, issueId);
  }

  @Get(':id/watching')
  @ApiOperation({ summary: 'Check if current user is watching an issue' })
  @ApiResponse({ status: 200, description: 'Watching status' })
  async isWatching(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.isWatching(req.user.tenantId, req.user.userId, issueId);
  }

  // ============================================
  // Phase 8: Issue Votes
  // ============================================

  @Get(':id/votes')
  @ApiOperation({ summary: 'Get votes for an issue' })
  @ApiResponse({ status: 200, description: 'Vote information' })
  async getVotes(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.getVotes(req.user.tenantId, req.user.userId, issueId);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on an issue' })
  @ApiResponse({ status: 200, description: 'Voted successfully' })
  async vote(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.vote(req.user.tenantId, req.user.userId, issueId);
  }

  @Delete(':id/vote')
  @ApiOperation({ summary: 'Remove vote from an issue' })
  @ApiResponse({ status: 200, description: 'Vote removed successfully' })
  async unvote(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.unvote(req.user.tenantId, req.user.userId, issueId);
  }

  @Get(':id/voted')
  @ApiOperation({ summary: 'Check if current user has voted on an issue' })
  @ApiResponse({ status: 200, description: 'Vote status' })
  async hasVoted(@Param('id') issueId: string, @Request() req: any) {
    return this.svc.hasVoted(req.user.tenantId, req.user.userId, issueId);
  }

  // ============================================
  // Phase 8: Issue Changelog
  // ============================================

  @Get(':id/changelog')
  @ApiOperation({ summary: 'Get changelog/history for an issue' })
  @ApiResponse({ status: 200, description: 'List of changes' })
  async getChangelog(
    @Param('id') issueId: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    return this.svc.getChangelog(req.user.tenantId, req.user.userId, issueId, limitNum);
  }
}

