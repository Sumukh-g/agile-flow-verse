import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KanbanService } from './kanban.service';

/**
 * Kanban Controller
 * Handles all Kanban board API endpoints
 */
@ApiTags('kanban')
@Controller('v1/kanban')
@UseGuards(JwtAuthGuard)
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Get('projects/:projectId/columns')
  @ApiOperation({ summary: 'Get all Kanban columns for a project' })
  @ApiResponse({ status: 200, description: 'Columns retrieved successfully' })
  async getColumns(@Param('projectId') projectId: string, @Request() req: any) {
    return this.kanbanService.getColumns(req.user.tenantId, req.user.userId, projectId);
  }

  @Post('projects/:projectId/columns')
  @ApiOperation({ summary: 'Create a new Kanban column' })
  @ApiResponse({ status: 201, description: 'Column created successfully' })
  async createColumn(@Param('projectId') projectId: string, @Body() dto: any, @Request() req: any) {
    return this.kanbanService.createColumn(req.user.tenantId, req.user.userId, projectId, dto);
  }

  @Put('projects/:projectId/columns/:columnId')
  @ApiOperation({ summary: 'Update a Kanban column' })
  @ApiResponse({ status: 200, description: 'Column updated successfully' })
  async updateColumn(
    @Param('projectId') projectId: string,
    @Param('columnId') columnId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.kanbanService.updateColumn(req.user.tenantId, req.user.userId, projectId, columnId, dto);
  }

  @Delete('projects/:projectId/columns/:columnId')
  @ApiOperation({ summary: 'Delete a Kanban column' })
  @ApiResponse({ status: 200, description: 'Column deleted successfully' })
  async deleteColumn(
    @Param('projectId') projectId: string,
    @Param('columnId') columnId: string,
    @Body() body: { moveToColumnId?: string },
    @Request() req: any,
  ) {
    return this.kanbanService.deleteColumn(req.user.tenantId, req.user.userId, projectId, columnId, body.moveToColumnId);
  }

  @Put('projects/:projectId/columns/reorder')
  @ApiOperation({ summary: 'Reorder Kanban columns' })
  @ApiResponse({ status: 200, description: 'Columns reordered successfully' })
  async reorderColumns(@Param('projectId') projectId: string, @Body() body: { columnIds: string[] }, @Request() req: any) {
    return this.kanbanService.reorderColumns(req.user.tenantId, req.user.userId, projectId, body.columnIds);
  }

  @Get('projects/:projectId/cards')
  @ApiOperation({ summary: 'Get all Kanban cards for a project' })
  @ApiResponse({ status: 200, description: 'Cards retrieved successfully' })
  async getCards(
    @Param('projectId') projectId: string,
    @Query('columnId') columnId: string | undefined,
    @Request() req: any,
  ) {
    return this.kanbanService.getCards(req.user.tenantId, req.user.userId, projectId, columnId);
  }

  @Post('projects/:projectId/cards')
  @ApiOperation({ summary: 'Create a new Kanban card' })
  @ApiResponse({ status: 201, description: 'Card created successfully' })
  async createCard(@Param('projectId') projectId: string, @Body() dto: any, @Request() req: any) {
    return this.kanbanService.createCard(req.user.tenantId, req.user.userId, projectId, dto);
  }

  @Put('projects/:projectId/cards/:cardId')
  @ApiOperation({ summary: 'Update a Kanban card' })
  @ApiResponse({ status: 200, description: 'Card updated successfully' })
  async updateCard(
    @Param('projectId') projectId: string,
    @Param('cardId') cardId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.kanbanService.updateCard(req.user.tenantId, req.user.userId, projectId, cardId, dto);
  }

  @Delete('projects/:projectId/cards/:cardId')
  @ApiOperation({ summary: 'Delete a Kanban card' })
  @ApiResponse({ status: 200, description: 'Card deleted successfully' })
  async deleteCard(@Param('projectId') projectId: string, @Param('cardId') cardId: string, @Request() req: any) {
    return this.kanbanService.deleteCard(req.user.tenantId, req.user.userId, projectId, cardId);
  }

  @Put('projects/:projectId/cards/:cardId/move')
  @ApiOperation({ summary: 'Move a Kanban card to another column' })
  @ApiResponse({ status: 200, description: 'Card moved successfully' })
  async moveCard(
    @Param('projectId') projectId: string,
    @Param('cardId') cardId: string,
    @Body() body: { targetColumnId: string; newPosition: number },
    @Request() req: any,
  ) {
    return this.kanbanService.moveCard(req.user.tenantId, req.user.userId, projectId, cardId, body.targetColumnId, body.newPosition);
  }
}

