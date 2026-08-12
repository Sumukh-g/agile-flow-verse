import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/comments')
export class CommentsController {
  constructor(private readonly svc: CommentsService) {}

  @Get(':noteId')
  @ApiOperation({ summary: 'List comments for a note' })
  async list(@Request() req: any, @Param('noteId') noteId: string) {
    return this.svc.listForNote(req.user.tenantId, req.user.userId, noteId);
  }

  @Post(':noteId')
  @ApiOperation({ summary: 'Add a comment to a note' })
  async create(
    @Request() req: any,
    @Param('noteId') noteId: string,
    @Body() body: { content: string },
  ) {
    return this.svc.create(req.user.tenantId, req.user.userId, noteId, body.content);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async remove(@Request() req: any, @Param('commentId') commentId: string) {
    return this.svc.delete(req.user.tenantId, req.user.userId, commentId);
  }
}
