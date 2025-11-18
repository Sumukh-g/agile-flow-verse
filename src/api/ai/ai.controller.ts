import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiStandardResponses } from '../common/swagger/swagger.decorators';
import { AiService } from './ai.service';
// no-op

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Chat endpoint is exposed via /v1/agents/chat in AgentsController for consistency.

  @Post('generate-tasks')
  @ApiOperation({
    summary: 'Generate tasks from description',
    description: 'Uses AI to generate a list of tasks based on a project description.',
  })
  @ApiResponse({ status: 200, description: 'Tasks generated successfully' })
  @ApiStandardResponses()
  async generateTasks(
    @Body() body: { description: string; projectId: string },
    @Request() req: any,
  ) {
    const { description, projectId } = body;
    
    // Get project context
    const project = await req.prisma.project.findUnique({
      where: { id: projectId, tenantId: req.user.tenantId },
    });

    const tasks = await this.aiService.generateTasksFromDescription(description, project);
    return { tasks };
  }

  @Post('summarize-notes')
  @ApiOperation({
    summary: 'Summarize notes',
    description: 'Uses AI to summarize multiple notes into a concise summary.',
  })
  @ApiResponse({ status: 200, description: 'Notes summarized successfully' })
  @ApiStandardResponses()
  async summarizeNotes(
    @Body() body: { noteIds: string[] },
    @Request() req: any,
  ) {
    const result = await this.aiService.runSummarizerAgent({
      type: 'notes',
      ids: body.noteIds,
    });
    return { summary: result.summary, count: result.count };
  }

  @Post('generate-update')
  @ApiOperation({
    summary: 'Generate project update',
    description: 'Uses AI to generate a professional status update for a project.',
  })
  @ApiResponse({ status: 200, description: 'Update generated successfully' })
  @ApiStandardResponses()
  async generateUpdate(
    @Body() body: { projectId: string; timePeriod?: string },
    @Request() req: any,
  ) {
    const { projectId, timePeriod = 'this week' } = body;
    
    const project = await req.prisma.project.findUnique({
      where: { id: projectId, tenantId: req.user.tenantId },
      include: {
        tasks: {
          take: 100,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const message = await this.aiService.generateUpdateMessage(project, project.tasks, timePeriod);
    return { message };
  }

  @Post('analyze-workflow')
  @ApiOperation({
    summary: 'Analyze workflow',
    description: 'Uses AI to analyze a workflow and provide improvement suggestions.',
  })
  @ApiResponse({ status: 200, description: 'Workflow analyzed successfully' })
  @ApiStandardResponses()
  async analyzeWorkflow(
    @Body() body: { workflowId: string },
    @Request() req: any,
  ) {
    const workflow = await req.prisma.workflow.findUnique({
      where: { id: body.workflowId, tenantId: req.user.tenantId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const result = await this.aiService.analyzeWorkflow(workflow);
    return result;
  }

  @Post('extract-action-items')
  @ApiOperation({
    summary: 'Extract action items from text',
    description: 'Uses AI to extract actionable items from unstructured text.',
  })
  @ApiResponse({ status: 200, description: 'Action items extracted successfully' })
  @ApiStandardResponses()
  async extractActionItems(@Body() body: { text: string }) {
    const items = await this.aiService.extractActionItems(body.text);
    return { items };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get AI service status',
    description: 'Check if AI service is properly configured and available.',
  })
  @ApiResponse({ status: 200, description: 'AI status retrieved' })
  async getStatus() {
    return {
      configured: this.aiService.isConfigured(),
      provider: process.env.AI_PROVIDER || 'openai',
      model: process.env.AI_MODEL || 'gpt-4o-mini',
    };
  }
}

