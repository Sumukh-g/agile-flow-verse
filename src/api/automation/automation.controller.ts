import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses, ApiIdParam } from '../common/swagger/swagger.decorators';
import { AutomationService } from './automation.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto, TriggerPayload } from './types';

@ApiTags('automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  // ─── Catalog ──────────────────────────────────────────────────────────────

  @Get('catalog')
  @ApiOperation({
    summary: 'Get trigger/condition/action catalog',
    description: 'Returns all registered triggers available for building automation rules.',
  })
  @ApiResponse({ status: 200, description: 'Catalog returned' })
  getCatalog() {
    return this.automationService.getCatalog();
  }

  // ─── Rules CRUD ───────────────────────────────────────────────────────────

  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create automation rule',
    description: 'Creates a new automation rule with a trigger, optional global conditions, and an action-step tree.',
  })
  @ApiResponse({ status: 201, description: 'Rule created' })
  @ApiStandardResponses()
  createRule(@Body() body: CreateAutomationRuleDto, @Request() req: any) {
    return this.automationService.createRule(req.user.tenantId, req.user.id, body);
  }

  @Get('rules')
  @ApiOperation({
    summary: 'List automation rules',
    description: 'Returns all automation rules for the tenant, optionally scoped to a project.',
  })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, description: 'Rules listed' })
  @ApiStandardResponses()
  listRules(@Query('projectId') projectId: string, @Request() req: any) {
    return this.automationService.listRules(req.user.tenantId, projectId);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get automation rule by ID' })
  @ApiIdParam('Rule ID')
  @ApiResponse({ status: 200, description: 'Rule found' })
  @ApiStandardResponses()
  getRule(@Param('id') id: string, @Request() req: any) {
    return this.automationService.getRule(req.user.tenantId, id);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update automation rule' })
  @ApiIdParam('Rule ID')
  @ApiResponse({ status: 200, description: 'Rule updated' })
  @ApiStandardResponses()
  updateRule(
    @Param('id') id: string,
    @Body() body: UpdateAutomationRuleDto,
    @Request() req: any,
  ) {
    return this.automationService.updateRule(req.user.tenantId, id, body);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete automation rule' })
  @ApiIdParam('Rule ID')
  @ApiResponse({ status: 204, description: 'Rule deleted' })
  @ApiStandardResponses()
  async deleteRule(@Param('id') id: string, @Request() req: any) {
    await this.automationService.deleteRule(req.user.tenantId, id);
  }

  @Patch('rules/:id/toggle')
  @ApiOperation({
    summary: 'Enable or disable a rule',
    description: 'Pass { "isActive": true } or { "isActive": false } to toggle.',
  })
  @ApiIdParam('Rule ID')
  @ApiResponse({ status: 200, description: 'Rule toggled' })
  @ApiStandardResponses()
  toggleRule(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Request() req: any,
  ) {
    return this.automationService.toggleRule(req.user.tenantId, id, body.isActive);
  }

  // ─── Dry Run ──────────────────────────────────────────────────────────────

  @Post('rules/:id/dry-run')
  @ApiOperation({
    summary: 'Dry-run a rule',
    description:
      'Simulates execution with a sample payload. All actions run in dry-run mode — no side effects.',
  })
  @ApiIdParam('Rule ID')
  @ApiResponse({ status: 200, description: 'Dry-run result' })
  @ApiStandardResponses()
  dryRunRule(
    @Param('id') id: string,
    @Body() samplePayload: Partial<TriggerPayload>,
    @Request() req: any,
  ) {
    return this.automationService.dryRunRule(req.user.tenantId, req.user.id, id, samplePayload);
  }

  // ─── Backward-compatible endpoint (replaces /workflows/:id/test) ──────────

  @Post('workflows/:id/test')
  @ApiOperation({
    summary: 'Test workflow (legacy)',
    description: 'Legacy endpoint — delegates to dry-run.',
  })
  @ApiIdParam('Rule/Workflow ID')
  @ApiResponse({ status: 200, description: 'Test result' })
  testWorkflowLegacy(
    @Param('id') id: string,
    @Body() sampleData: Partial<TriggerPayload>,
    @Request() req: any,
  ) {
    return this.automationService.dryRunRule(req.user.tenantId, req.user.id, id, sampleData);
  }

  // ─── Audit Trail ──────────────────────────────────────────────────────────

  @Get('executions')
  @ApiOperation({
    summary: 'List execution history',
    description: 'Returns recent executions for the tenant, optionally filtered by rule.',
  })
  @ApiQuery({ name: 'ruleId', required: false })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset' })
  @ApiResponse({ status: 200, description: 'Executions listed' })
  @ApiStandardResponses()
  getExecutions(
    @Query('ruleId') ruleId: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Request() req: any,
  ) {
    return this.automationService.getExecutions(
      req.user.tenantId,
      ruleId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('executions/:id')
  @ApiOperation({
    summary: 'Get execution detail with step logs',
    description: 'Returns full execution detail including every step log with input/output payloads.',
  })
  @ApiIdParam('Execution ID')
  @ApiResponse({ status: 200, description: 'Execution detail' })
  @ApiStandardResponses()
  getExecutionDetail(@Param('id') id: string, @Request() req: any) {
    return this.automationService.getExecutionDetail(req.user.tenantId, id);
  }

  @Post('executions/:id/replay')
  @ApiOperation({
    summary: 'Replay a past execution',
    description: 'Re-runs the same payload against the current rule definition. Useful for debugging.',
  })
  @ApiIdParam('Execution ID')
  @ApiQuery({ name: 'dryRun', required: false, description: 'Set to "true" to replay as dry-run' })
  @ApiResponse({ status: 200, description: 'Replay dispatched' })
  @ApiStandardResponses()
  replayExecution(
    @Param('id') id: string,
    @Query('dryRun') dryRun: string,
    @Request() req: any,
  ) {
    return this.automationService.replayExecution(
      req.user.tenantId,
      id,
      dryRun === 'true',
    );
  }
}
