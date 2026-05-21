import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class EstimationService {
  private readonly logger = new Logger(EstimationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async estimateStoryPoints(tenantId: string, projectId: string, cardTitle: string, cardDescription?: string) {
    const completedCards = await this.prisma.kanbanCard.findMany({
      where: {
        tenantId,
        projectId,
        status: 'done',
        storyPoints: { not: null },
      },
      select: { id: true, title: true, description: true, storyPoints: true },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });

    if (completedCards.length < 3) {
      return {
        estimate: null,
        confidence: 'low',
        range: [1, 8],
        reasoning: 'Not enough historical data for AI estimation. Complete more cards with story points first.',
        similarCards: [],
      };
    }

    const historicalContext = completedCards
      .slice(0, 15)
      .map(c => `- "${c.title}" (${c.description?.substring(0, 80) || 'no desc'}): ${c.storyPoints} pts`)
      .join('\n');

    const prompt = `You are an expert Scrum Master estimating story points using the Fibonacci scale (1, 2, 3, 5, 8, 13, 21).

Based on these completed stories from the same project:
${historicalContext}

Estimate the story points for this new item:
Title: "${cardTitle}"
Description: "${cardDescription || 'No description provided'}"

Return a JSON object:
{
  "estimate": 5,
  "confidence": "medium",
  "range": [3, 8],
  "reasoning": "explanation comparing to similar past items",
  "similarCards": [{"title": "similar card title", "points": 5}]
}

Use only Fibonacci numbers. Confidence: "high" (very similar to past items), "medium" (somewhat similar), "low" (no good comparisons).`;

    try {
      const result = await this.aiService.chat({
        messages: [
          { role: 'system', content: 'You are an expert Scrum Master. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        maxTokens: 1000,
      });

      const parsed = JSON.parse(result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return parsed;
    } catch (error) {
      this.logger.error('AI estimation error:', error);
      const avgPoints = completedCards.reduce((s, c) => s + (c.storyPoints || 0), 0) / completedCards.length;
      const fibonacci = [1, 2, 3, 5, 8, 13, 21];
      const nearest = fibonacci.reduce((prev, curr) =>
        Math.abs(curr - avgPoints) < Math.abs(prev - avgPoints) ? curr : prev
      );

      return {
        estimate: nearest,
        confidence: 'low',
        range: [Math.max(1, nearest - 2), nearest + 3],
        reasoning: `Fallback: based on project average of ${Math.round(avgPoints)} points.`,
        similarCards: [],
      };
    }
  }

  async embedCard(tenantId: string, cardId: string) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, tenantId },
      select: { id: true, title: true, description: true },
    });

    if (!card) return null;

    const text = `${card.title} ${card.description || ''}`.trim();
    const embedding = this.simpleTextHash(text);

    await this.prisma.cardEmbedding.upsert({
      where: { cardId },
      update: { embedding, updatedAt: new Date() },
      create: { tenantId, cardId, embedding },
    });

    return { cardId, embedded: true };
  }

  async findDuplicates(tenantId: string, projectId: string, title: string, description?: string) {
    const existingCards = await this.prisma.kanbanCard.findMany({
      where: { tenantId, projectId, archived: false },
      select: { id: true, title: true, description: true, status: true },
      take: 100,
    });

    const inputText = `${title} ${description || ''}`.toLowerCase();
    const inputWords = new Set(inputText.split(/\s+/).filter(w => w.length > 2));

    const similarities = existingCards.map(card => {
      const cardText = `${card.title} ${card.description || ''}`.toLowerCase();
      const cardWords = new Set(cardText.split(/\s+/).filter(w => w.length > 2));
      const intersection = new Set([...inputWords].filter(w => cardWords.has(w)));
      const union = new Set([...inputWords, ...cardWords]);
      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      return { ...card, similarity: Math.round(similarity * 100) };
    });

    const duplicates = similarities
      .filter(s => s.similarity >= 40)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(s => ({ cardId: s.id, title: s.title, status: s.status, similarity: s.similarity }));

    return { duplicates, hasDuplicates: duplicates.length > 0 };
  }

  private simpleTextHash(text: string): any {
    const words = text.toLowerCase().split(/\s+/);
    return { words: words.slice(0, 50), hash: Buffer.from(text).toString('base64').substring(0, 64) };
  }
}
