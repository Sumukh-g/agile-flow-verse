import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/comments')
export class CommentsController {
  constructor(private readonly svc: CommentsService) {}

  @Post(':noteId')
  async create(@Param('noteId') noteId: string, @Body() body: { content: string }, req: any) {
    return this.svc.create(req.user.tenantId, req.user.userId, noteId, body.content);
  }
} 