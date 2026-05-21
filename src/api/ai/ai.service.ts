import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

const createTaskInput = z.object({
  title: z.string().min(1),
  projectId: z.string().min(1),
  description: z.string().optional(),
});
const summarizeNotesInput = z.object({
  noteIds: z.array(z.string()).min(1),
});
const postUpdateInput = z.object({
  message: z.string().min(1),
});

export type AgentRole = 'Intake' | 'Planner' | 'Comms' | 'Summarizer';

interface AIProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseURL?: string;
}

interface AICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface AICompletionResponse {
  content: string;
  tokensUsed: number;
  costCents?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private config: AIProviderConfig;

  constructor(private readonly prisma: PrismaService) {
    this.config = {
      provider: process.env.AI_PROVIDER || 'openai',
      apiKey: process.env.AI_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    };

    if (!this.config.apiKey) {
      this.logger.warn('AI_API_KEY not configured. AI features will return mock data.');
    }
  }

  // Provider-specific API keys (optional overrides)
  private getApiKey(provider?: string): string {
    const p = (provider || this.config.provider || 'openai').toLowerCase();
    if (p === 'google' || p === 'gemini') {
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || this.config.apiKey;
    }
    if (p === 'perplexity') {
      return process.env.PERPLEXITY_API_KEY || this.config.apiKey;
    }
    return this.config.apiKey;
  }

  /**
   * Check if AI is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Generic AI completion method (OpenAI-compatible)
   */
  private async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured()) {
      this.logger.warn('AI not configured, returning mock response');
      return {
        content: `Mock AI response for: ${request.userPrompt.substring(0, 50)}...`,
        tokensUsed: 100,
        costCents: 0,
      };
    }

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as OpenAIResponse;
      const content = data.choices[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;
      
      // Rough cost calculation (example: $0.01 per 1000 tokens)
      const costCents = Math.ceil((tokensUsed / 1000) * 1);

      return { content, tokensUsed, costCents };
    } catch (error) {
      this.logger.error('AI completion error:', error);
      throw error;
    }
  }

  // Unified chat across providers (OpenAI, Google Gemini, Perplexity)
  async chat(params: {
    provider?: 'openai' | 'google' | 'gemini' | 'perplexity';
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string }> {
    const provider = (params.provider || this.config.provider || 'openai').toLowerCase() as 'openai' | 'google' | 'gemini' | 'perplexity';

    // Mock mode fallback
    const apiKey = this.getApiKey(provider);
    if (!apiKey) {
      const combined = params.messages.map(m => `${m.role}: ${m.content}`).join('\n');
      return { content: `Mock response (AI not configured).\n\nYou said:\n${combined.slice(0, 2000)}` };
    }

    switch (provider) {
      case 'openai':
        return this.chatOpenAI(apiKey, params.model || this.config.model, params.messages, params.temperature, params.maxTokens);
      case 'perplexity':
        return this.chatPerplexity(apiKey, params.model || 'llama-3.1-sonar-large-128k-online', params.messages, params.temperature, params.maxTokens);
      case 'google':
      case 'gemini':
        return this.chatGemini(apiKey, params.model || 'gemini-1.5-flash', params.messages, params.temperature, params.maxTokens);
      default:
        return this.chatOpenAI(apiKey, params.model || this.config.model, params.messages, params.temperature, params.maxTokens);
    }
  }

  private async chatOpenAI(
    apiKey: string,
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    temperature = 0.7,
    maxTokens = 2000,
  ): Promise<{ content: string }> {
    const response = await fetch(`${this.config.baseURL || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
    }
    const data = await response.json() as OpenAIResponse;
    const content = data?.choices?.[0]?.message?.content || '';
    return { content };
  }

  private async chatPerplexity(
    apiKey: string,
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    temperature = 0.7,
    maxTokens = 2000,
  ): Promise<{ content: string }> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });
    if (!response.ok) {
      throw new Error(`Perplexity error ${response.status}: ${await response.text()}`);
    }
    const data = await response.json() as PerplexityResponse;
    const content = data?.choices?.[0]?.message?.content || '';
    return { content };
  }

  private async chatGemini(
    apiKey: string,
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    temperature = 0.7,
    maxTokens = 2000,
  ): Promise<{ content: string }> {
    // Map to Gemini "contents"
    const contents = [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: m.content }] });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Gemini error ${response.status}: ${await response.text()}`);
    }
    const data = await response.json() as GeminiResponse;
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { content };
  }

  /**
   * Summarize text
   */
  async summarizeText(text: string, context?: string): Promise<string> {
    const response = await this.complete({
      systemPrompt: 'You are a helpful assistant that summarizes text concisely and clearly.',
      userPrompt: `${context ? `Context: ${context}\n\n` : ''}Summarize the following text:\n\n${text}`,
      temperature: 0.5,
      maxTokens: 500,
    });

    return response.content;
  }

  /**
   * Generate tasks from a project description
   */
  async generateTasksFromDescription(
    description: string,
    projectContext?: any,
  ): Promise<Array<{ title: string; description: string; priority: string; estimatedHours?: number }>> {
    const contextStr = projectContext
      ? `\nProject: ${projectContext.name}\nGoals: ${projectContext.description || 'Not specified'}`
      : '';

    const response = await this.complete({
      systemPrompt: `You are a project management assistant. Generate a list of specific, actionable tasks based on the project description. 
Return ONLY a JSON array of tasks with format: [{"title": "Task title", "description": "Detailed description", "priority": "low|medium|high|critical", "estimatedHours": number}]`,
      userPrompt: `${contextStr}\n\nProject Description:\n${description}\n\nGenerate 5-10 specific tasks:`,
      temperature: 0.7,
      maxTokens: 1500,
    });

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const tasks = JSON.parse(jsonStr);
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      this.logger.error('Failed to parse AI-generated tasks:', error);
      return [];
    }
  }

  /**
   * Generate a project update message
   */
  async generateUpdateMessage(
    project: any,
    tasks: any[],
    timePeriod: string = 'this week',
  ): Promise<string> {
    const completedTasks = tasks.filter((t) => t.status === 'done');
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
    const blockedTasks = tasks.filter((t) => t.isBlocked);

    const response = await this.complete({
      systemPrompt: `You are a project manager writing a professional status update. Be concise, positive, and clear about progress and challenges.`,
      userPrompt: `Project: ${project.name}
Time Period: ${timePeriod}

Stats:
- Total Tasks: ${tasks.length}
- Completed: ${completedTasks.length}
- In Progress: ${inProgressTasks.length}
- Blocked: ${blockedTasks.length}
- Project Progress: ${project.progress}%

Generate a brief, professional status update (2-3 paragraphs):`,
      temperature: 0.7,
      maxTokens: 500,
    });

    return response.content;
  }

  /**
   * Analyze workflow and provide suggestions
   */
  async analyzeWorkflow(workflow: any): Promise<{ analysis: string; suggestions: string[] }> {
    const response = await this.complete({
      systemPrompt: `You are an automation expert. Analyze workflows and provide actionable suggestions for improvement.
Return ONLY a JSON object with format: {"analysis": "Brief analysis", "suggestions": ["suggestion 1", "suggestion 2", ...]}`,
      userPrompt: `Workflow: ${workflow.name}
Description: ${workflow.description || 'No description'}
Trigger: ${JSON.stringify(workflow.trigger)}
Conditions: ${JSON.stringify(workflow.conditions)}
Actions: ${JSON.stringify(workflow.actions)}

Analyze this workflow and provide 3-5 specific suggestions:`,
      temperature: 0.6,
      maxTokens: 800,
    });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(jsonStr);
      return {
        analysis: result.analysis || 'No analysis provided',
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      };
    } catch (error) {
      this.logger.error('Failed to parse workflow analysis:', error);
      return {
        analysis: 'Failed to analyze workflow',
        suggestions: [],
      };
    }
  }

  /**
   * Generate note outline from topic
   */
  async generateNoteOutline(topic: string, context?: string): Promise<string> {
    const response = await this.complete({
      systemPrompt: 'You are a technical writer. Create clear, well-structured outlines for documentation.',
      userPrompt: `${context ? `Context: ${context}\n\n` : ''}Create a detailed outline for a note about: ${topic}`,
      temperature: 0.6,
      maxTokens: 800,
    });

    return response.content;
  }

  /**
   * Extract action items from text
   */
  async extractActionItems(text: string): Promise<string[]> {
    const response = await this.complete({
      systemPrompt: `You are a task extraction assistant. Extract clear, actionable items from text.
Return ONLY a JSON array of strings: ["action 1", "action 2", ...]`,
      userPrompt: `Extract all action items from the following text:\n\n${text}`,
      temperature: 0.5,
      maxTokens: 500,
    });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const items = JSON.parse(jsonStr);
      return Array.isArray(items) ? items : [];
    } catch (error) {
      this.logger.error('Failed to parse action items:', error);
      return [];
    }
  }

  // === Agent Orchestration ===

  /**
   * Run an agent with tracking
   */
  async runAgent(
    tenantId: string,
    agentId: string,
    input: any,
  ): Promise<{ output: any; run: any }> {
    const agent = await this.prisma.tx.agent.findFirst({
      where: { id: agentId, tenantId },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    this.logger.log(`Running agent: ${agent.name} (${agent.role})`);

    let output: any;
    let toolCalls = 0;
    let costCents = 0;

    try {
      switch (agent.role) {
        case 'Intake':
          output = await this.runIntakeAgent(input);
          toolCalls = 1;
          costCents = 10;
          break;
        case 'Planner':
          output = await this.runPlannerAgent(input);
          toolCalls = 1;
          costCents = 25;
          break;
        case 'Comms':
          output = await this.runCommsAgent(tenantId, input);
          toolCalls = 1;
          costCents = 15;
          break;
        case 'Summarizer':
          output = await this.runSummarizerAgent(tenantId, input);
          toolCalls = 1;
          costCents = 10;
          break;
        default:
          throw new Error(`Unknown agent role: ${agent.role}`);
      }

      // Log the run
      const run = await this.prisma.tx.agentRun.create({
        data: {
          tenantId,
          agentId,
          toolCalls,
          input: input as any,
          output: output as any,
          costCents,
        },
        include: {
          agent: true,
        },
      });

      return { output, run };
    } catch (error) {
      this.logger.error(`Agent ${agent.name} error:`, error);
      throw error;
    }
  }

  /**
   * Intake Agent: Normalize project/goal descriptions
   */
  private async runIntakeAgent(input: any): Promise<any> {
    const { description, type = 'project' } = input;

    const response = await this.complete({
      systemPrompt: `You are an intake specialist. Normalize and structure user input into clear project requirements.
Return ONLY a JSON object with format: {"name": "Project name", "description": "Clear description", "goals": ["goal 1", "goal 2"], "scope": "In/out of scope summary", "estimatedDuration": "time estimate"}`,
      userPrompt: `Type: ${type}\nUser Input:\n${description}\n\nNormalize this into structured requirements:`,
      temperature: 0.5,
      maxTokens: 800,
    });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Failed to parse intake response:', error);
      return { description, goals: [], scope: '', estimatedDuration: 'Unknown' };
    }
  }

  /**
   * Planner Agent: Break down into tasks and milestones
   */
  private async runPlannerAgent(input: any): Promise<any> {
    const { projectName, description, goals } = input;

    const response = await this.complete({
      systemPrompt: `You are a project planner. Break down projects into tasks, milestones, and phases.
Return ONLY a JSON object with format: {"milestones": [{"name": "Milestone 1", "dueDate": "relative time"}], "tasks": [{"title": "Task", "description": "desc", "milestone": "milestone name", "priority": "low|medium|high", "estimatedHours": number}], "phases": ["Phase 1", "Phase 2"]}`,
      userPrompt: `Project: ${projectName}
Description: ${description}
Goals: ${JSON.stringify(goals || [])}

Create a detailed project plan:`,
      temperature: 0.6,
      maxTokens: 2000,
    });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Failed to parse planner response:', error);
      return { milestones: [], tasks: [], phases: [] };
    }
  }

  /**
   * Comms Agent: Generate updates and stakeholder messages
   */
  private async runCommsAgent(tenantId: string, input: any): Promise<any> {
    const { projectId, timePeriod, audience = 'team' } = input;

    const project = await this.prisma.tx.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        tasks: {
          where: { tenantId },
          take: 50,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const message = await this.generateUpdateMessage(project, project.tasks, timePeriod);

    return {
      message,
      audience,
      timestamp: new Date().toISOString(),
      project: { id: project.id, name: project.name },
    };
  }

  /**
   * Summarizer Agent: Summarize tasks, notes, and activity
   */
  public async runSummarizerAgent(tenantId: string, input: any): Promise<any> {
    const { type, ids } = input;

    if (type === 'notes') {
      const notes = await this.prisma.tx.note.findMany({
        where: { id: { in: ids }, tenantId },
      });

      const combinedContent = notes.map((n) => `${n.title}\n${n.content}`).join('\n\n---\n\n');
      const summary = await this.summarizeText(combinedContent, 'Project notes');

      return {
        type: 'notes',
        count: notes.length,
        summary,
      };
    } else if (type === 'tasks') {
      const tasks = await this.prisma.tx.task.findMany({
        where: { id: { in: ids }, tenantId },
      });

      const combinedContent = tasks
        .map((t) => `${t.title} (${t.status})\n${t.description || 'No description'}`)
        .join('\n\n');
      const summary = await this.summarizeText(combinedContent, 'Project tasks');

      return {
        type: 'tasks',
        count: tasks.length,
        summary,
      };
    }

    throw new Error(`Unsupported summarizer type: ${type}`);
  }

  // Legacy tool methods (for backwards compatibility)
  async toolCreateTask(input: z.infer<typeof createTaskInput>) {
    createTaskInput.parse(input);
    return { ok: true, tool: 'createTask', input };
  }

  async toolSummarizeNotes(tenantId: string, input: z.infer<typeof summarizeNotesInput>) {
    summarizeNotesInput.parse(input);
    const result = await this.runSummarizerAgent(tenantId, { type: 'notes', ids: input.noteIds });
    return { ok: true, tool: 'summarizeNotes', input, summary: result.summary };
  }

  async toolPostUpdate(input: z.infer<typeof postUpdateInput>) {
    postUpdateInput.parse(input);
    return { ok: true, tool: 'postUpdate', input };
  }

  // ===========================
  // Sprint Retro AI Facilitator
  // ===========================

  async generateRetroInsights(tenantId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId },
      include: {
        kanbanCards: {
          select: { id: true, title: true, status: true, storyPoints: true, updatedAt: true, createdAt: true },
        },
      },
    });

    if (!sprint) throw new Error('Sprint not found');

    const totalPoints = sprint.kanbanCards.reduce((s, c) => s + (c.storyPoints || 0), 0);
    const completedPoints = sprint.kanbanCards.filter(c => c.status === 'done')
      .reduce((s, c) => s + (c.storyPoints || 0), 0);

    const stuckInReview = sprint.kanbanCards.filter(c => {
      if (c.status !== 'review') return false;
      const days = (new Date().getTime() - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return days > 3;
    });

    const pastRetros = await this.prisma.sprint.findMany({
      where: { tenantId, projectId: sprint.projectId, status: 'COMPLETED', id: { not: sprintId } },
      select: { name: true, wentWell: true, needsImprovement: true, actionItems: true, velocity: true, committedPoints: true },
      orderBy: { endDate: 'desc' },
      take: 3,
    });

    const velocityDelta = pastRetros.length > 0 && pastRetros[0].velocity
      ? ((sprint.velocity || completedPoints) - pastRetros[0].velocity) / pastRetros[0].velocity * 100
      : 0;

    const prompt = `You are an expert Agile coach facilitating a sprint retrospective.

Sprint: "${sprint.name}"
Committed: ${sprint.committedPoints || totalPoints} points
Completed: ${completedPoints} points
Velocity change from last sprint: ${Math.round(velocityDelta)}%
Items added mid-sprint (scope creep): ${sprint.scopeChanges}
Cards stuck in review >3 days: ${stuckInReview.length} (${stuckInReview.map(c => c.title).join(', ')})

Past retrospective themes:
${pastRetros.map(r => `- ${r.name}: Well: "${r.wentWell || 'N/A'}", Improve: "${r.needsImprovement || 'N/A'}", Actions: "${r.actionItems || 'N/A'}"`).join('\n')}

Generate retrospective insights. Return JSON:
{
  "prompts": ["question for team discussion 1", "question 2", "question 3"],
  "patterns": ["recurring pattern observed across sprints"],
  "suggestedWentWell": "pre-fill for what went well",
  "suggestedNeedsImprovement": "pre-fill for what needs improvement",
  "recommendedActionItems": ["specific action 1", "specific action 2"]
}`;

    try {
      const result = await this.chat({
        messages: [
          { role: 'system', content: 'You are an expert Agile coach. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        maxTokens: 1500,
      });

      return JSON.parse(result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
    } catch (error) {
      this.logger.error('Retro AI error:', error);
      const prompts = [];
      if (stuckInReview.length > 0) {
        prompts.push(`${stuckInReview.length} cards were stuck in Review for >3 days. What caused the bottleneck?`);
      }
      if (Math.abs(velocityDelta) > 15) {
        prompts.push(`Velocity ${velocityDelta > 0 ? 'increased' : 'dropped'} by ${Math.abs(Math.round(velocityDelta))}%. What changed?`);
      }
      if (sprint.scopeChanges > 0) {
        prompts.push(`${sprint.scopeChanges} items were added mid-sprint. How can we prevent scope creep?`);
      }
      if (prompts.length === 0) {
        prompts.push('What went well this sprint?', 'What could be improved?', 'What will we commit to doing differently?');
      }

      return {
        prompts,
        patterns: [],
        suggestedWentWell: '',
        suggestedNeedsImprovement: '',
        recommendedActionItems: [],
      };
    }
  }

  // ===========================
  // Epic Decomposition
  // ===========================

  async decomposeEpic(tenantId: string, epicId: string, description: string) {
    const epic = await this.prisma.epic.findFirst({
      where: { id: epicId, tenantId },
      select: { id: true, name: true, projectId: true, priority: true, targetDate: true },
    });

    if (!epic) throw new Error('Epic not found');

    const prompt = `You are an expert product owner decomposing an epic into user stories.

Epic: "${epic.name}"
Priority: ${epic.priority}
Target Date: ${epic.targetDate?.toISOString().split('T')[0] || 'Not set'}
Description: ${description}

Decompose this into 8-12 user stories. For each story, provide:
- title (concise, action-oriented)
- description (as a user story: "As a [role], I want to [action], so that [benefit]")
- acceptanceCriteria (2-3 bullet points)
- storyPoints (Fibonacci: 1, 2, 3, 5, 8, 13)
- priority (critical, high, medium, low)
- suggestedSprint (1, 2, 3 — which sprint to schedule in)

Return JSON:
{
  "stories": [
    {
      "title": "...",
      "description": "...",
      "acceptanceCriteria": "...",
      "storyPoints": 5,
      "priority": "high",
      "suggestedSprint": 1
    }
  ],
  "totalPoints": 0,
  "estimatedSprints": 3
}`;

    try {
      const result = await this.chat({
        messages: [
          { role: 'system', content: 'You are an expert product owner. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        maxTokens: 3000,
      });

      const parsed = JSON.parse(result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return { epicId, epicName: epic.name, projectId: epic.projectId, ...parsed };
    } catch (error) {
      this.logger.error('Epic decomposition error:', error);
      return {
        epicId, epicName: epic.name, projectId: epic.projectId,
        stories: [],
        totalPoints: 0,
        estimatedSprints: 0,
        error: 'AI decomposition unavailable. Please create stories manually.',
      };
    }
  }

  // ===========================
  // Natural Language Query
  // ===========================

  async naturalLanguageQuery(tenantId: string, projectId: string, query: string) {
    const schema = `Available data: 
- kanbanCards (id, title, description, status, priority, storyPoints, epicId, sprintId, dueDate, isRefined, assignees)
- tasks (id, title, status, priority, storyPoints, epicId, sprintId)
- sprints (id, name, status, startDate, endDate, velocity, committedPoints)
- epics (id, name, status, progress, riskLevel, targetDate, storyPoints)`;

    const prompt = `${schema}

User question: "${query}"

Generate a Prisma-compatible filter to answer this question. Return JSON:
{
  "model": "kanbanCard" | "task" | "sprint" | "epic",
  "where": { prisma filter object },
  "select": { fields to return },
  "orderBy": { optional ordering },
  "take": number (max 50),
  "explanation": "human-readable explanation of what this query does"
}

IMPORTANT: Do NOT include tenantId or projectId in the filter — those are added automatically.`;

    try {
      const result = await this.chat({
        messages: [
          { role: 'system', content: 'You are a database query assistant. Always respond with valid JSON only. Generate safe read-only Prisma queries.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        maxTokens: 1000,
      });

      const parsed = JSON.parse(result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());

      const allowedModels = ['kanbanCard', 'task', 'sprint', 'epic'];
      if (!allowedModels.includes(parsed.model)) {
        return { error: 'Invalid query target', results: [] };
      }

      const sensitiveFields = ['password', 'totpSecret', 'totpBackupCodes', 'token', 'refreshToken', 'codeVerifier'];
      const allowedSelectFields: Record<string, string[]> = {
        kanbanCard: ['id', 'title', 'description', 'status', 'priority', 'storyPoints', 'dueDate', 'isRefined', 'createdAt', 'updatedAt'],
        task: ['id', 'title', 'description', 'status', 'priority', 'storyPoints', 'dueDate', 'createdAt', 'updatedAt'],
        sprint: ['id', 'name', 'status', 'goal', 'startDate', 'endDate', 'velocity', 'committedPoints', 'plannedPoints', 'scopeChanges'],
        epic: ['id', 'name', 'description', 'status', 'progress', 'riskLevel', 'riskReason', 'targetDate', 'startDate', 'storyPoints', 'businessValue', 'priority', 'color'],
      };

      if (parsed.select && typeof parsed.select === 'object') {
        const allowed = allowedSelectFields[parsed.model] || [];
        const filteredSelect: Record<string, boolean> = {};
        for (const key of Object.keys(parsed.select)) {
          if (allowed.includes(key) && !sensitiveFields.includes(key)) {
            filteredSelect[key] = true;
          }
        }
        parsed.select = Object.keys(filteredSelect).length > 0 ? filteredSelect : undefined;
      }

      if (parsed.where && typeof parsed.where === 'object') {
        const whereStr = JSON.stringify(parsed.where);
        for (const field of sensitiveFields) {
          if (whereStr.includes(field)) {
            return { error: 'Query references restricted fields', results: [] };
          }
        }
      }

      const where = { ...parsed.where, tenantId };
      if (projectId && parsed.model !== 'sprint') {
        (where as any).projectId = projectId;
      }

      const modelMap: Record<string, any> = {
        kanbanCard: this.prisma.kanbanCard,
        task: this.prisma.task,
        sprint: this.prisma.sprint,
        epic: this.prisma.epic,
      };

      const results = await modelMap[parsed.model].findMany({
        where,
        select: parsed.select,
        orderBy: parsed.orderBy,
        take: Math.min(parsed.take || 20, 50),
      });

      return {
        query,
        explanation: parsed.explanation,
        model: parsed.model,
        resultCount: results.length,
        results,
      };
    } catch (error) {
      this.logger.error('NL query error:', error);
      return {
        query,
        error: 'Could not process natural language query. Please try rephrasing.',
        results: [],
      };
    }
  }
} 