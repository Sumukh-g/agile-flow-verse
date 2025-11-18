import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiIdParam, ApiStandardResponses } from '../common/swagger/swagger.decorators';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/agents')
export class AgentsController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with multi-provider models (OpenAI, Gemini, Perplexity)',
    description: 'Premium-only. Supports provider, model, and messages.',
  })
  @ApiResponse({ status: 200, description: 'Chat response returned' })
  @ApiStandardResponses()
  async chat(
    @Body() body: any,
    @Request() req: any,
  ) {
    const tenant = await this.prisma.tx.tenant.findUnique({ where: { id: req.user.tenantId } });
    const sku = tenant?.sku || 'basic';
    if (['basic', 'free'].includes(sku)) {
      throw new ForbiddenException('AI chat is available for Premium plans only.');
    }
    return this.aiService.chat(body);
  }

  @Get()
  @ApiOperation({
    summary: 'List all agents',
    description: 'Retrieves all available AI agents for the tenant.',
  })
  @ApiResponse({ status: 200, description: 'Agents retrieved successfully' })
  @ApiStandardResponses()
  async getAgents(@Request() req: any) {
    return this.prisma.tx.agent.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get agent by ID',
    description: 'Retrieves a specific agent by ID.',
  })
  @ApiIdParam('Agent ID')
  @ApiResponse({ status: 200, description: 'Agent retrieved successfully' })
  @ApiStandardResponses()
  async getAgent(@Param('id') id: string, @Request() req: any) {
    const agent = await this.prisma.tx.agent.findFirst({
      where: { id, tenantId: req.user.tenantId },
      include: {
        runs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    return agent;
  }

  @Post('run')
  @ApiOperation({
    summary: 'Run an agent',
    description: 'Executes an agent with provided input and tracks the run.',
  })
  @ApiResponse({ status: 200, description: 'Agent executed successfully' })
  @ApiStandardResponses()
  async runAgent(
    @Body() body: { agentId: string; input: any },
    @Request() req: any,
  ) {
    const { agentId, input } = body;
    const result = await this.aiService.runAgent(req.user.tenantId, agentId, input);
    return result;
  }

  @Get('runs')
  @ApiOperation({
    summary: 'Get agent runs',
    description: 'Retrieves agent execution history, optionally filtered by agent.',
  })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of runs to retrieve' })
  @ApiResponse({ status: 200, description: 'Agent runs retrieved successfully' })
  @ApiStandardResponses()
  async getAgentRuns(
    @Query('agentId') agentId: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const where: any = { tenantId: req.user.tenantId };
    if (agentId) {
      where.agentId = agentId;
    }

    return this.prisma.tx.agentRun.findMany({
      where,
      take: limit ? parseInt(limit, 10) : 50,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: true,
      },
    });
  }

  @Get('runs/:id')
  @ApiOperation({
    summary: 'Get agent run by ID',
    description: 'Retrieves a specific agent run with full details.',
  })
  @ApiIdParam('Agent Run ID')
  @ApiResponse({ status: 200, description: 'Agent run retrieved successfully' })
  @ApiStandardResponses()
  async getAgentRun(@Param('id') id: string, @Request() req: any) {
    const run = await this.prisma.tx.agentRun.findFirst({
      where: { id, tenantId: req.user.tenantId },
      include: {
        agent: true,
      },
    });

    if (!run) {
      throw new Error('Agent run not found');
    }

    return run;
  }
}

