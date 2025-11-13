import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses, ApiIdParam } from '../common/swagger/swagger.decorators';
import { WorkflowService, Workflow } from './workflow.service';

@ApiTags('automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/automation')
export class AutomationController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('workflows')
  @ApiOperation({
    summary: 'Create workflow',
    description: 'Creates a new automation workflow with triggers, conditions, and actions.',
  })
  @ApiResponse({ status: 201, description: 'Workflow created successfully' })
  @ApiStandardResponses()
  async createWorkflow(
    @Body() body: Omit<Workflow, 'id' | 'tenantId'>,
    @Request() req: any,
  ) {
    return this.workflowService.createWorkflow(req.user.tenantId, body);
  }

  @Get('workflows')
  @ApiOperation({
    summary: 'List workflows',
    description: 'Retrieves all workflows for the tenant, optionally filtered by project.',
  })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully' })
  @ApiStandardResponses()
  async getWorkflows(
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
    return this.workflowService.getWorkflows(req.user.tenantId, projectId);
  }

  @Put('workflows/:id')
  @ApiOperation({
    summary: 'Update workflow',
    description: 'Updates an existing workflow.',
  })
  @ApiIdParam('Workflow ID')
  @ApiResponse({ status: 200, description: 'Workflow updated successfully' })
  @ApiStandardResponses()
  async updateWorkflow(
    @Param('id') id: string,
    @Body() body: Partial<Workflow>,
    @Request() req: any,
  ) {
    return this.workflowService.updateWorkflow(req.user.tenantId, id, body);
  }

  @Delete('workflows/:id')
  @ApiOperation({
    summary: 'Delete workflow',
    description: 'Deletes a workflow permanently.',
  })
  @ApiIdParam('Workflow ID')
  @ApiResponse({ status: 200, description: 'Workflow deleted successfully' })
  @ApiStandardResponses()
  async deleteWorkflow(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.workflowService.deleteWorkflow(req.user.tenantId, id);
    return { ok: true };
  }

  @Post('workflows/:id/test')
  @ApiOperation({
    summary: 'Test workflow',
    description: 'Tests a workflow with sample data without actually executing actions.',
  })
  @ApiIdParam('Workflow ID')
  @ApiResponse({ status: 200, description: 'Workflow test completed' })
  @ApiStandardResponses()
  async testWorkflow(
    @Param('id') id: string,
    @Body() sampleData: any,
    @Request() req: any,
  ) {
    return this.workflowService.testWorkflow(req.user.tenantId, id, sampleData);
  }
}

