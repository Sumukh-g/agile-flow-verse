import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SprintStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantContextInterceptor } from '../common/tenant/tenant-context.interceptor';
import { SprintsService } from './sprints.service';
import { DoDService } from './dod.service';

@ApiTags('Sprints')
@ApiBearerAuth()
@Controller('v1/sprints')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class SprintsController {
  constructor(
    private readonly sprintsService: SprintsService,
    private readonly dodService: DoDService,
  ) {}

  /**
   * Create a new sprint
   */
  @Post()
  @ApiOperation({ summary: 'Create a new sprint' })
  @ApiResponse({ status: 201, description: 'Sprint created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 409, description: 'Sprint dates overlap' })
  async create(
    @Request() req: any,
    @Body() body: {
      projectId: string;
      name: string;
      goal?: string;
      startDate: string;
      endDate: string;
    }
  ) {
    return this.sprintsService.create(req.user.tenantId, req.user.userId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate)
    });
  }

  /**
   * Get all sprints for a project
   */
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all sprints for a project' })
  @ApiQuery({ name: 'status', required: false, enum: SprintStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeCards', required: false, type: Boolean })
  async findAllByProject(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('status') status?: SprintStatus,
    @Query('limit') limit?: string,
    @Query('includeCards') includeCards?: string
  ) {
    return this.sprintsService.findAllByProject(req.user.tenantId, req.user.userId, projectId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      includeCards: includeCards === 'true'
    });
  }

  /**
   * Get active sprint for a project
   */
  @Get('project/:projectId/active')
  @ApiOperation({ summary: 'Get the active sprint for a project' })
  async getActiveSprint(
    @Request() req: any,
    @Param('projectId') projectId: string
  ) {
    return this.sprintsService.getActiveSprint(req.user.tenantId, req.user.userId, projectId);
  }

  /**
   * Get backlog items for a project
   */
  @Get('project/:projectId/backlog')
  @ApiOperation({ summary: 'Get backlog items (not in any sprint)' })
  async getBacklog(
    @Request() req: any,
    @Param('projectId') projectId: string
  ) {
    return this.sprintsService.getBacklog(req.user.tenantId, req.user.userId, projectId);
  }

  /**
   * Get velocity data for a project
   */
  @Get('project/:projectId/velocity')
  @ApiOperation({ summary: 'Get velocity data for completed sprints' })
  @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of sprints to include' })
  async getVelocity(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('count') count?: string
  ) {
    return this.sprintsService.getVelocityData(
      req.user.tenantId,
      req.user.userId,
      projectId,
      count ? parseInt(count, 10) : 6
    );
  }

  /**
   * Get a single sprint
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a sprint by ID' })
  @ApiResponse({ status: 200, description: 'Sprint details' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.sprintsService.findOne(req.user.tenantId, req.user.userId, id);
  }

  /**
   * Get burndown data for a sprint
   */
  @Get(':id/burndown')
  @ApiOperation({ summary: 'Get burndown chart data for a sprint' })
  async getBurndown(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.sprintsService.getBurndownData(req.user.tenantId, req.user.userId, id);
  }

  /**
   * Update a sprint
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a sprint' })
  @ApiResponse({ status: 200, description: 'Sprint updated successfully' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      goal: string;
      startDate: string;
      endDate: string;
    }>
  ) {
    const data: any = { ...body };
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.endDate) data.endDate = new Date(body.endDate);
    
    return this.sprintsService.update(req.user.tenantId, req.user.userId, id, data);
  }

  /**
   * Start a sprint
   */
  @Post(':id/start')
  @ApiOperation({ summary: 'Start a sprint' })
  @ApiResponse({ status: 200, description: 'Sprint started' })
  @ApiResponse({ status: 409, description: 'Another sprint is already active' })
  @HttpCode(HttpStatus.OK)
  async start(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.sprintsService.start(req.user.tenantId, req.user.userId, id);
  }

  /**
   * Complete a sprint
   */
  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a sprint with optional retrospective' })
  @HttpCode(HttpStatus.OK)
  async complete(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body?: {
      wentWell?: string;
      needsImprovement?: string;
      actionItems?: string;
    }
  ) {
    return this.sprintsService.complete(req.user.tenantId, req.user.userId, id, body);
  }

  /**
   * Add items to a sprint
   */
  @Post(':id/items')
  @ApiOperation({ summary: 'Add cards or tasks to a sprint' })
  @HttpCode(HttpStatus.OK)
  async addItems(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      itemIds: string[];
      itemType: 'card' | 'task';
    }
  ) {
    return this.sprintsService.addItems(req.user.tenantId, req.user.userId, id, body.itemIds, body.itemType);
  }

  /**
   * Remove items from a sprint
   */
  @Delete(':id/items')
  @ApiOperation({ summary: 'Remove cards or tasks from a sprint' })
  async removeItems(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      itemIds: string[];
      itemType: 'card' | 'task';
    }
  ) {
    return this.sprintsService.removeItems(req.user.tenantId, req.user.userId, id, body.itemIds, body.itemType);
  }

  /**
   * Delete a sprint
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sprint' })
  @ApiResponse({ status: 200, description: 'Sprint deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete active sprint' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  async delete(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.sprintsService.delete(req.user.tenantId, req.user.userId, id);
  }

  // ===========================
  // Sprint Review Endpoints
  // ===========================

  @Post(':id/review')
  @ApiOperation({ summary: 'Create a sprint review' })
  async createReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      attendees: { userId: string; name: string; role: string }[];
      demonstratedItems: { cardId: string; title: string; accepted: boolean; feedback?: string }[];
      stakeholderNotes?: string;
      reviewDate: string;
    }
  ) {
    return this.sprintsService.createReview(req.user.tenantId, req.user.userId, id, {
      ...body,
      reviewDate: new Date(body.reviewDate),
    });
  }

  @Get(':id/review')
  @ApiOperation({ summary: 'Get sprint review' })
  async getReview(@Request() req: any, @Param('id') id: string) {
    return this.sprintsService.getReview(req.user.tenantId, req.user.userId, id);
  }

  @Put(':id/review')
  @ApiOperation({ summary: 'Update sprint review' })
  async updateReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<{
      attendees: any;
      demonstratedItems: any;
      stakeholderNotes: string;
      reviewDate: string;
    }>
  ) {
    const data: any = { ...body };
    if (body.reviewDate) data.reviewDate = new Date(body.reviewDate);
    return this.sprintsService.updateReview(req.user.tenantId, req.user.userId, id, data);
  }

  // ===========================
  // Capacity Endpoints
  // ===========================

  @Post(':id/capacity')
  @ApiOperation({ summary: 'Set capacity for a team member in a sprint' })
  @HttpCode(HttpStatus.OK)
  async setCapacity(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { userId: string; dailyHours?: number; leaveDays?: number; skills?: string[] }
  ) {
    return this.sprintsService.setCapacity(req.user.tenantId, req.user.userId, id, body.userId, body);
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get capacity data for a sprint' })
  async getCapacity(@Request() req: any, @Param('id') id: string) {
    return this.sprintsService.getCapacity(req.user.tenantId, req.user.userId, id);
  }

  @Get(':id/capacity/load')
  @ApiOperation({ summary: 'Get capacity vs load analysis' })
  async getCapacityVsLoad(@Request() req: any, @Param('id') id: string) {
    return this.sprintsService.getCapacityVsLoad(req.user.tenantId, req.user.userId, id);
  }

  // ===========================
  // Enhanced Velocity Endpoint
  // ===========================

  @Get('project/:projectId/velocity/enhanced')
  @ApiOperation({ summary: 'Get enhanced velocity data with inflation detection' })
  async getEnhancedVelocity(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('count') count?: string
  ) {
    return this.sprintsService.getEnhancedVelocityData(
      req.user.tenantId, req.user.userId, projectId, count ? parseInt(count, 10) : 6
    );
  }

  // ===========================
  // Definition of Done Endpoints
  // ===========================

  @Get('project/:projectId/dod')
  @ApiOperation({ summary: 'Get Definition of Done for a project' })
  async getDoD(@Request() req: any, @Param('projectId') projectId: string) {
    return this.dodService.getDoD(req.user.tenantId, projectId);
  }

  @Post('project/:projectId/dod')
  @ApiOperation({ summary: 'Set Definition of Done for a project' })
  @HttpCode(HttpStatus.OK)
  async setDoD(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() body: { items: { id: string; label: string; required: boolean }[] }
  ) {
    return this.dodService.setDoD(req.user.tenantId, req.user.userId, projectId, body.items);
  }

  @Get('cards/:cardId/dod-checks')
  @ApiOperation({ summary: 'Get DoD checks for a card' })
  async getDoDChecks(@Request() req: any, @Param('cardId') cardId: string) {
    return this.dodService.getDoDChecks(req.user.tenantId, cardId);
  }

  @Post('cards/:cardId/dod-checks/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle a DoD check for a card' })
  @HttpCode(HttpStatus.OK)
  async toggleDoDCheck(
    @Request() req: any,
    @Param('cardId') cardId: string,
    @Param('itemId') itemId: string
  ) {
    return this.dodService.toggleDoDCheck(req.user.tenantId, cardId, itemId, req.user.userId);
  }

  @Get('cards/:cardId/dod-status')
  @ApiOperation({ summary: 'Check if card meets Definition of Done' })
  async getDoDStatus(@Request() req: any, @Param('cardId') cardId: string) {
    return this.dodService.isCardDoDComplete(req.user.tenantId, cardId);
  }
}
