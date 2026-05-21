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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantContextInterceptor } from '../common/tenant/tenant-context.interceptor';
import { EpicsService } from './epics.service';

@ApiTags('Epics')
@ApiBearerAuth()
@Controller('v1/epics')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  /**
   * Create a new epic
   */
  @Post()
  @ApiOperation({ summary: 'Create a new epic' })
  @ApiResponse({ status: 201, description: 'Epic created successfully' })
  async create(
    @Request() req: any,
    @Body() body: {
      projectId: string;
      name: string;
      description?: string;
      color?: string;
      priority?: string;
      startDate?: string;
      targetDate?: string;
      businessValue?: number;
    }
  ) {
    return this.epicsService.create(req.user.tenantId, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined
    });
  }

  /**
   * Get all epics for a project
   */
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all epics for a project' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (open, in_progress, done)' })
  @ApiQuery({ name: 'includeItems', required: false, type: Boolean })
  async findAllByProject(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('includeItems') includeItems?: string
  ) {
    return this.epicsService.findAllByProject(req.user.tenantId, projectId, {
      status,
      includeItems: includeItems === 'true'
    });
  }

  /**
   * Get roadmap view for a project
   */
  @Get('project/:projectId/roadmap')
  @ApiOperation({ summary: 'Get epic roadmap view with timeline grouping' })
  async getRoadmap(
    @Request() req: any,
    @Param('projectId') projectId: string
  ) {
    return this.epicsService.getRoadmap(req.user.tenantId, projectId);
  }

  /**
   * Get a single epic
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an epic by ID' })
  @ApiResponse({ status: 200, description: 'Epic details' })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.epicsService.findOne(req.user.tenantId, id);
  }

  /**
   * Update an epic
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an epic' })
  @ApiResponse({ status: 200, description: 'Epic updated successfully' })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      description: string;
      status: string;
      color: string;
      priority: string;
      startDate: string;
      targetDate: string;
      businessValue: number;
    }>
  ) {
    const data: any = { ...body };
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.targetDate) data.targetDate = new Date(body.targetDate);
    
    return this.epicsService.update(req.user.tenantId, id, data);
  }

  /**
   * Add items to an epic
   */
  @Post(':id/items')
  @ApiOperation({ summary: 'Add cards or tasks to an epic' })
  @HttpCode(HttpStatus.OK)
  async addItems(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      itemIds: string[];
      itemType: 'card' | 'task';
    }
  ) {
    return this.epicsService.addItems(req.user.tenantId, id, body.itemIds, body.itemType);
  }

  /**
   * Remove items from an epic
   */
  @Delete(':id/items')
  @ApiOperation({ summary: 'Remove cards or tasks from an epic' })
  async removeItems(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      itemIds: string[];
      itemType: 'card' | 'task';
    }
  ) {
    return this.epicsService.removeItems(req.user.tenantId, id, body.itemIds, body.itemType);
  }

  /**
   * Delete an epic
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an epic' })
  @ApiResponse({ status: 200, description: 'Epic deleted' })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  async delete(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.epicsService.delete(req.user.tenantId, id);
  }

  @Get(':id/risk')
  @ApiOperation({ summary: 'Check epic risk level' })
  async checkRisk(@Request() req: any, @Param('id') id: string) {
    return this.epicsService.checkEpicRisk(req.user.tenantId, id);
  }

  @Get('project/:projectId/risk-summary')
  @ApiOperation({ summary: 'Get risk summary for all epics in a project' })
  async riskSummary(@Request() req: any, @Param('projectId') projectId: string) {
    return this.epicsService.checkAllEpicRisks(req.user.tenantId, projectId);
  }
}
