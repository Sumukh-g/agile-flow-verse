import { Body, Controller, Get, Param, Post, Request, UseInterceptors, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantContextInterceptor } from '../common/tenant/tenant-context.interceptor';
import { AiService } from './ai.service';
import { SprintPlannerService } from './sprint-planner.service';
import { EstimationService } from './estimation.service';
import { BurndownRiskService } from './burndown-risk.service';
import { PrismaService } from '../prisma/prisma.service';

const estimateSchema = z.object({
  projectId: z.string().min(1, 'projectId required'),
  title: z.string().min(1, 'title required').max(500),
  description: z.string().max(5000).optional(),
});

const querySchema = z.object({
  projectId: z.string().min(1),
  query: z.string().min(3, 'Query too short').max(500, 'Query too long'),
});

const decomposeSchema = z.object({
  description: z.string().min(10, 'Description too short').max(5000),
});

const AI_COST_LIMIT_CENTS_PER_DAY = 500;

@ApiTags('Scrum AI')
@ApiBearerAuth()
@Controller('v1')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class ScrumAiController {
  constructor(
    private readonly aiService: AiService,
    private readonly sprintPlanner: SprintPlannerService,
    private readonly estimation: EstimationService,
    private readonly burndownRisk: BurndownRiskService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkAiCostLimit(tenantId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCost = await this.prisma.agentRun.aggregate({
      where: { tenantId, createdAt: { gte: today } },
      _sum: { costCents: true },
    });

    if ((todayCost._sum.costCents || 0) >= AI_COST_LIMIT_CENTS_PER_DAY) {
      throw new BadRequestException('Daily AI usage limit reached. Try again tomorrow.');
    }
  }

  private sanitize(input: string): string {
    return input
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\0/g, '')
      .trim();
  }

  @Post('sprints/:id/ai/recommend')
  @ApiOperation({ summary: 'AI-powered sprint planning recommendation' })
  @HttpCode(HttpStatus.OK)
  async recommendSprint(
    @Request() req: any,
    @Param('id') sprintId: string,
    @Body() body: { projectId: string }
  ) {
    return this.sprintPlanner.recommendSprintItems(req.user.tenantId, body.projectId, sprintId);
  }

  @Get('sprints/:id/ai/scope-creep')
  @ApiOperation({ summary: 'Detect scope creep in a sprint' })
  async detectScopeCreep(@Request() req: any, @Param('id') sprintId: string) {
    return this.sprintPlanner.detectScopeCreep(req.user.tenantId, sprintId);
  }

  @Get('sprints/:id/ai/risk-analysis')
  @ApiOperation({ summary: 'AI burndown risk analysis for a sprint' })
  async analyzeRisk(@Request() req: any, @Param('id') sprintId: string) {
    return this.burndownRisk.analyzeSprintRisk(req.user.tenantId, sprintId);
  }

  @Post('sprints/:id/ai/retro-insights')
  @ApiOperation({ summary: 'AI-generated retrospective insights' })
  @HttpCode(HttpStatus.OK)
  async retroInsights(@Request() req: any, @Param('id') sprintId: string) {
    return this.aiService.generateRetroInsights(req.user.tenantId, sprintId);
  }

  @Post('ai/estimate-points')
  @ApiOperation({ summary: 'AI story point estimation' })
  @HttpCode(HttpStatus.OK)
  async estimatePoints(
    @Request() req: any,
    @Body() body: { projectId: string; title: string; description?: string }
  ) {
    const validated = estimateSchema.parse(body);
    await this.checkAiCostLimit(req.user.tenantId);
    return this.estimation.estimateStoryPoints(
      req.user.tenantId, validated.projectId,
      this.sanitize(validated.title), validated.description ? this.sanitize(validated.description) : undefined
    );
  }

  @Post('ai/find-duplicates')
  @ApiOperation({ summary: 'Find potential duplicate cards' })
  @HttpCode(HttpStatus.OK)
  async findDuplicates(
    @Request() req: any,
    @Body() body: { projectId: string; title: string; description?: string }
  ) {
    const validated = estimateSchema.parse(body);
    return this.estimation.findDuplicates(
      req.user.tenantId, validated.projectId,
      this.sanitize(validated.title), validated.description ? this.sanitize(validated.description) : undefined
    );
  }

  @Post('epics/:id/ai/decompose')
  @ApiOperation({ summary: 'AI-powered epic decomposition into stories' })
  @HttpCode(HttpStatus.OK)
  async decomposeEpic(
    @Request() req: any,
    @Param('id') epicId: string,
    @Body() body: { description: string }
  ) {
    const validated = decomposeSchema.parse(body);
    await this.checkAiCostLimit(req.user.tenantId);
    return this.aiService.decomposeEpic(req.user.tenantId, epicId, this.sanitize(validated.description));
  }

  @Post('ai/query')
  @ApiOperation({ summary: 'Natural language query interface' })
  @HttpCode(HttpStatus.OK)
  async naturalLanguageQuery(
    @Request() req: any,
    @Body() body: { projectId: string; query: string }
  ) {
    const validated = querySchema.parse(body);
    await this.checkAiCostLimit(req.user.tenantId);
    return this.aiService.naturalLanguageQuery(req.user.tenantId, validated.projectId, this.sanitize(validated.query));
  }
}
