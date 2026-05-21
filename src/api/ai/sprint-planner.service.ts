import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class SprintPlannerService {
  private readonly logger = new Logger(SprintPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async recommendSprintItems(tenantId: string, projectId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId },
      include: { capacities: true },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    const [backlogItems, velocityData, epics] = await Promise.all([
      this.prisma.kanbanCard.findMany({
        where: { tenantId, projectId, sprintId: null, archived: false },
        include: { epic: { select: { id: true, name: true, targetDate: true, priority: true, riskLevel: true } } },
        orderBy: { position: 'asc' },
        take: 50,
      }),
      this.prisma.sprint.findMany({
        where: { tenantId, projectId, status: 'COMPLETED' },
        orderBy: { endDate: 'desc' },
        take: 5,
        select: { velocity: true, committedPoints: true },
      }),
      this.prisma.epic.findMany({
        where: { tenantId, projectId, status: { not: 'done' } },
        select: { id: true, name: true, targetDate: true, priority: true, progress: true, riskLevel: true },
      }),
    ]);

    const avgVelocity = velocityData.length > 0
      ? velocityData.reduce((s, v) => s + (v.velocity || 0), 0) / velocityData.length
      : 20;

    const sprintDays = Math.ceil(
      (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const backlogSummary = backlogItems.map(item => ({
      id: item.id,
      title: item.title,
      storyPoints: item.storyPoints || 0,
      priority: item.priority,
      isRefined: item.isRefined,
      epicName: item.epic?.name || 'No Epic',
      epicPriority: item.epic?.priority || 'medium',
      epicAtRisk: item.epic?.riskLevel === 'at_risk' || item.epic?.riskLevel === 'critical',
    }));

    const prompt = `You are an expert Scrum Master planning a sprint.

Sprint: "${sprint.name}" (${sprintDays} days, ${sprint.startDate.toISOString().split('T')[0]} to ${sprint.endDate.toISOString().split('T')[0]})
Goal: ${sprint.goal || 'Not set'}
Team average velocity: ${Math.round(avgVelocity)} story points
Recommended capacity (90%): ${Math.round(avgVelocity * 0.9)} story points

Backlog items available:
${JSON.stringify(backlogSummary, null, 2)}

At-risk epics: ${epics.filter(e => e.riskLevel === 'at_risk' || e.riskLevel === 'critical').map(e => e.name).join(', ') || 'None'}

Select the best items for this sprint. Prioritize:
1. Items from at-risk epics (to get back on track)
2. Higher priority items
3. Refined items over unrefined ones
4. Stay within the recommended capacity

Return a JSON object with exactly this structure:
{
  "selectedItemIds": ["id1", "id2"],
  "totalPoints": 0,
  "reasoning": "explanation",
  "risks": ["risk1"],
  "capacityUsed": 0
}`;

    try {
      const result = await this.aiService.chat({
        messages: [
          { role: 'system', content: 'You are an expert Scrum Master. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        maxTokens: 2000,
      });

      const parsed = JSON.parse(result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return {
        recommendation: parsed,
        backlogItems: backlogSummary,
        velocity: { average: Math.round(avgVelocity), recommended: Math.round(avgVelocity * 0.9) },
      };
    } catch (error) {
      this.logger.error('AI Sprint Planning error:', error);
      const sorted = [...backlogSummary]
        .filter(i => i.isRefined && i.storyPoints > 0)
        .sort((a, b) => {
          if (a.epicAtRisk && !b.epicAtRisk) return -1;
          if (!a.epicAtRisk && b.epicAtRisk) return 1;
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
        });

      let totalPoints = 0;
      const selected: string[] = [];
      for (const item of sorted) {
        if (totalPoints + item.storyPoints <= avgVelocity * 0.9) {
          selected.push(item.id);
          totalPoints += item.storyPoints;
        }
      }

      return {
        recommendation: {
          selectedItemIds: selected,
          totalPoints,
          reasoning: 'Fallback recommendation based on priority sorting and velocity cap.',
          risks: ['AI unavailable — using heuristic-based selection'],
          capacityUsed: totalPoints,
        },
        backlogItems: backlogSummary,
        velocity: { average: Math.round(avgVelocity), recommended: Math.round(avgVelocity * 0.9) },
      };
    }
  }

  async detectScopeCreep(tenantId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId },
      select: { id: true, name: true, startDate: true, scopeChanges: true, committedPoints: true },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    const currentCards = await this.prisma.kanbanCard.findMany({
      where: { sprintId, tenantId },
      select: { id: true, title: true, storyPoints: true, createdAt: true, updatedAt: true },
    });

    const addedAfterStart = currentCards.filter(c =>
      c.updatedAt > sprint.startDate || c.createdAt > sprint.startDate
    );

    const addedPoints = addedAfterStart.reduce((s, c) => s + (c.storyPoints || 0), 0);
    const currentTotal = currentCards.reduce((s, c) => s + (c.storyPoints || 0), 0);

    return {
      sprintId,
      sprintName: sprint.name,
      originalCommitted: sprint.committedPoints || 0,
      currentTotal,
      scopeChanges: sprint.scopeChanges,
      addedItems: addedAfterStart.map(c => ({ id: c.id, title: c.title, points: c.storyPoints || 0 })),
      addedPoints,
      creepPercentage: sprint.committedPoints
        ? Math.round((addedPoints / sprint.committedPoints) * 100)
        : 0,
    };
  }
}
