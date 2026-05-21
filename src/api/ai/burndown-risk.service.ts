import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class BurndownRiskService {
  private readonly logger = new Logger(BurndownRiskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async analyzeSprintRisk(tenantId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, tenantId, status: 'ACTIVE' },
      include: {
        kanbanCards: {
          select: {
            id: true, title: true, status: true, storyPoints: true,
            priority: true, updatedAt: true, createdAt: true,
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    if (!sprint) {
      return { riskLevel: 'unknown', message: 'Sprint not found or not active' };
    }

    const now = new Date();
    const totalDays = Math.ceil((sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsed = Math.ceil((now.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, totalDays - elapsed);
    const progressPercent = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0;

    const totalPoints = sprint.kanbanCards.reduce((s, c) => s + (c.storyPoints || 0), 0);
    const completedPoints = sprint.kanbanCards
      .filter(c => c.status === 'done')
      .reduce((s, c) => s + (c.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;

    const idealRemaining = totalPoints * (1 - elapsed / totalDays);
    const deviation = totalPoints > 0 ? ((remainingPoints - idealRemaining) / totalPoints) * 100 : 0;

    const stuckCards = sprint.kanbanCards.filter(c => {
      if (c.status === 'done' || c.status === 'todo') return false;
      const daysSinceUpdate = (now.getTime() - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 2;
    });

    let riskLevel = 'on_track';
    const risks: string[] = [];
    const suggestions: string[] = [];

    if (deviation > 40) {
      riskLevel = 'critical';
      risks.push(`Sprint is ${Math.round(deviation)}% behind the ideal burndown line`);
    } else if (deviation > 20) {
      riskLevel = 'at_risk';
      risks.push(`Sprint is ${Math.round(deviation)}% behind the ideal burndown line`);
    }

    if (stuckCards.length > 0) {
      risks.push(`${stuckCards.length} card(s) stuck in progress for >2 days`);
      suggestions.push(`Review blockers on: ${stuckCards.map(c => c.title).join(', ')}`);
    }

    if (remaining <= 2 && remainingPoints > totalPoints * 0.4) {
      riskLevel = 'critical';
      risks.push(`Only ${remaining} day(s) remaining with ${Math.round((remainingPoints / totalPoints) * 100)}% work left`);
    }

    const descopeCandidates = sprint.kanbanCards
      .filter(c => c.status === 'todo' && c.storyPoints)
      .sort((a, b) => {
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) -
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 1);
      })
      .slice(0, 3)
      .map(c => ({ id: c.id, title: c.title, points: c.storyPoints }));

    if (riskLevel !== 'on_track' && descopeCandidates.length > 0) {
      const totalDescope = descopeCandidates.reduce((s, c) => s + (c.points || 0), 0);
      suggestions.push(`Consider descoping ${descopeCandidates.length} items (${totalDescope} pts): ${descopeCandidates.map(c => c.title).join(', ')}`);
    }

    if (riskLevel !== 'on_track' && this.aiService.isConfigured()) {
      try {
        const aiResult = await this.aiService.chat({
          messages: [
            { role: 'system', content: 'You are an expert Scrum Master. Provide 2-3 concise, actionable recommendations. Respond as plain text, no JSON.' },
            { role: 'user', content: `Sprint "${sprint.name}" is ${riskLevel}. ${remaining} days left. ${remainingPoints}/${totalPoints} points remaining. ${stuckCards.length} stuck cards. ${sprint.scopeChanges} items added mid-sprint. What should the team do?` },
          ],
          temperature: 0.3,
          maxTokens: 500,
        });
        suggestions.push(aiResult.content);
      } catch (error) {
        this.logger.warn('AI risk analysis unavailable:', error);
      }
    }

    return {
      sprintId,
      sprintName: sprint.name,
      riskLevel,
      metrics: {
        totalDays, elapsed, remaining, progressPercent,
        totalPoints, completedPoints, remainingPoints,
        deviation: Math.round(deviation),
        idealRemaining: Math.round(idealRemaining),
      },
      risks,
      suggestions,
      stuckCards: stuckCards.map(c => ({ id: c.id, title: c.title, points: c.storyPoints, status: c.status })),
      descopeCandidates,
    };
  }

  async analyzeAllActiveSprints() {
    const activeSprints = await this.prisma.sprint.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, tenantId: true },
    });

    const results = [];
    for (const sprint of activeSprints) {
      try {
        const analysis = await this.analyzeSprintRisk(sprint.tenantId, sprint.id);
        if (analysis.riskLevel !== 'on_track' && analysis.riskLevel !== 'unknown') {
          results.push(analysis);
        }
      } catch (error) {
        this.logger.error(`Error analyzing sprint ${sprint.id}:`, error);
      }
    }

    return results;
  }
}
