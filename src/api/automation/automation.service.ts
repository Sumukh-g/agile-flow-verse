import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerRegistry } from './registry/trigger.registry';
import { AutomationProducer } from './queue/automation.producer';
import { CircuitBreaker } from './engine/circuit-breaker';
import {
  TriggerPayload,
  TriggerKey,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from './types';

/**
 * Primary facade for the Automation Engine.
 *
 * Responsibilities:
 *   1. CRUD for AutomationRule records
 *   2. Listen to domain events (via @OnEvent) and dispatch matching rules to the queue
 *   3. Serve execution history and step logs for the audit trail
 *
 * The heavy lifting (condition evaluation, action execution) lives in AutomationRunner.
 */
@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly triggerRegistry: TriggerRegistry,
    private readonly producer: AutomationProducer,
    private readonly circuitBreaker: CircuitBreaker,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async createRule(tenantId: string, userId: string, dto: CreateAutomationRuleDto) {
    return this.prisma.automationRule.create({
      data: {
        tenantId,
        createdById: userId,
        name: dto.name,
        description: dto.description,
        projectId: dto.projectId,
        isActive: dto.isActive ?? true,
        triggerKey: dto.triggerKey,
        triggerParams: (dto.triggerParams as object) ?? {},
        conditions: (dto.conditions as object) ?? undefined,
        steps: dto.steps as object,
      },
    });
  }

  async listRules(tenantId: string, projectId?: string) {
    return this.prisma.automationRule.findMany({
      where: {
        tenantId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        triggerKey: true,
        projectId: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { executions: true } },
      },
    });
  }

  async getRule(tenantId: string, ruleId: string) {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id: ruleId, tenantId },
    });
    if (!rule) throw new NotFoundException(`AutomationRule "${ruleId}" not found`);
    return rule;
  }

  async updateRule(tenantId: string, ruleId: string, dto: UpdateAutomationRuleDto) {
    await this.getRule(tenantId, ruleId);
    return this.prisma.automationRule.update({
      where: { id: ruleId, tenantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.triggerKey !== undefined && { triggerKey: dto.triggerKey }),
        ...(dto.triggerParams !== undefined && { triggerParams: dto.triggerParams as object }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions as object }),
        ...(dto.steps !== undefined && { steps: dto.steps as object }),
        version: { increment: 1 },
      },
    });
  }

  async deleteRule(tenantId: string, ruleId: string) {
    await this.getRule(tenantId, ruleId);
    await this.prisma.automationRule.delete({ where: { id: ruleId, tenantId } });
  }

  async toggleRule(tenantId: string, ruleId: string, isActive: boolean) {
    await this.getRule(tenantId, ruleId);
    return this.prisma.automationRule.update({
      where: { id: ruleId, tenantId },
      data: { isActive, version: { increment: 1 } },
    });
  }

  // ─── Audit Trail ──────────────────────────────────────────────────────────

  async getExecutions(
    tenantId: string,
    ruleId?: string,
    limit = 50,
    offset = 0,
  ) {
    return this.prisma.automationExecution.findMany({
      where: {
        tenantId,
        ...(ruleId ? { ruleId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        ruleId: true,
        status: true,
        isDryRun: true,
        chainDepth: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
        errorMessage: true,
        createdAt: true,
        rule: { select: { name: true, triggerKey: true } },
      },
    });
  }

  async getExecutionDetail(tenantId: string, executionId: string) {
    const execution = await this.prisma.automationExecution.findFirst({
      where: { id: executionId, tenantId },
      include: {
        stepLogs: { orderBy: { stepIndex: 'asc' } },
        rule: { select: { name: true, triggerKey: true } },
      },
    });
    if (!execution) throw new NotFoundException(`Execution "${executionId}" not found`);
    return execution;
  }

  // ─── Dry Run (test without side effects) ──────────────────────────────────

  async dryRunRule(tenantId: string, userId: string, ruleId: string, samplePayload: Partial<TriggerPayload>) {
    const rule = await this.getRule(tenantId, ruleId);
    const payload: TriggerPayload = {
      event: (samplePayload.event ?? rule.triggerKey) as TriggerKey,
      entityId: samplePayload.entityId ?? 'dry-run-entity',
      entityType: samplePayload.entityType ?? 'task',
      tenantId,
      projectId: samplePayload.projectId ?? rule.projectId ?? undefined,
      userId,
      before: samplePayload.before,
      after: samplePayload.after,
      metadata: samplePayload.metadata,
    };

    return this.dispatchPayload(payload, true);
  }

  /** Replay a past execution (useful for debugging failed runs) */
  async replayExecution(tenantId: string, executionId: string, isDryRun = false) {
    const original = await this.prisma.automationExecution.findFirst({
      where: { id: executionId, tenantId },
    });
    if (!original) throw new NotFoundException(`Execution "${executionId}" not found`);

    const payload = original.triggerPayload as unknown as TriggerPayload;
    return this.dispatchPayload(payload, isDryRun);
  }

  // ─── Catalog (for the frontend builder) ────────────────────────────────────

  getCatalog() {
    return this.triggerRegistry.getCatalog();
  }

  // ─── Event Listeners ───────────────────────────────────────────────────────

  @OnEvent('task.created', { async: true })
  handleTaskCreated(data: Record<string, unknown>) {
    this.handleDomainEvent('task.created', data);
  }

  @OnEvent('task.updated', { async: true })
  handleTaskUpdated(data: Record<string, unknown>) {
    const hasStatusChange = data.before &&
      data.after &&
      (data.before as Record<string, unknown>).status !== (data.after as Record<string, unknown>).status;
    if (hasStatusChange) {
      this.handleDomainEvent('task.status.changed', data);
    }
    const hasPriorityChange = data.before &&
      data.after &&
      (data.before as Record<string, unknown>).priority !== (data.after as Record<string, unknown>).priority;
    if (hasPriorityChange) {
      this.handleDomainEvent('task.priority.changed', data);
    }
  }

  @OnEvent('task.assigned', { async: true })
  handleTaskAssigned(data: Record<string, unknown>) {
    this.handleDomainEvent('task.assigned', data);
  }

  @OnEvent('project.created', { async: true })
  handleProjectCreated(data: Record<string, unknown>) {
    this.handleDomainEvent('project.created', data);
  }

  @OnEvent('issue.created', { async: true })
  handleIssueCreated(data: Record<string, unknown>) {
    this.handleDomainEvent('issue.created', data);
  }

  @OnEvent('issue.updated', { async: true })
  handleIssueUpdated(data: Record<string, unknown>) {
    const hasStatusChange = data.before &&
      data.after &&
      (data.before as Record<string, unknown>).status !== (data.after as Record<string, unknown>).status;
    if (hasStatusChange) {
      this.handleDomainEvent('issue.status.changed', data);
    }
  }

  // ─── Internal dispatch ──────────────────────────────────────────────────────

  private handleDomainEvent(event: TriggerKey, data: Record<string, unknown>): void {
    const payload: TriggerPayload = {
      event,
      entityId: String(data.id ?? data.entityId ?? ''),
      entityType: String(data.entityType ?? event.split('.')[0]),
      tenantId: String(data.tenantId ?? ''),
      projectId: data.projectId ? String(data.projectId) : undefined,
      userId: data.userId ? String(data.userId) : undefined,
      before: data.before as Record<string, unknown> | undefined,
      after: data.after as Record<string, unknown> | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };

    if (!payload.tenantId) {
      this.logger.warn(`Dropped event "${event}": missing tenantId`);
      return;
    }

    this.dispatchPayload(payload, false).catch((err) => {
      this.logger.error(`Error dispatching event "${event}": ${(err as Error).message}`);
    });
  }

  private async dispatchPayload(
    payload: TriggerPayload,
    isDryRun: boolean,
  ): Promise<{ dispatchedCount: number; executionIds: string[] }> {
    const { tenantId } = payload;

    const rules = await this.prisma.automationRule.findMany({
      where: {
        tenantId,
        isActive: true,
        triggerKey: payload.event,
      },
      select: {
        id: true,
        triggerParams: true,
        projectId: true,
      },
    });

    if (rules.length === 0) return { dispatchedCount: 0, executionIds: [] };

    const executionIds: string[] = [];

    for (const rule of rules) {
      // Project-scoped rules must match the event's projectId
      if (rule.projectId && rule.projectId !== payload.projectId) continue;

      const trigger = this.triggerRegistry.get(payload.event);
      const params = (rule.triggerParams ?? {}) as Record<string, unknown>;

      if (trigger && !trigger.matches(payload, params)) continue;

      const idempotencyKey = this.buildIdempotencyKey(rule.id, payload);

      // Skip if already dispatched for this event (idempotency)
      const existing = await this.prisma.automationExecution.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (existing) {
        this.logger.debug(`Skipping duplicate dispatch for rule ${rule.id} (idempotency key exists)`);
        continue;
      }

      const execution = await this.prisma.automationExecution.create({
        data: {
          ruleId: rule.id,
          tenantId,
          status: 'PENDING',
          isDryRun,
          triggerPayload: payload as unknown as object,
          idempotencyKey,
          chainDepth: 0,
        },
      });

      await this.producer.enqueue({
        ruleId: rule.id,
        executionId: execution.id,
        triggerPayload: payload,
        isDryRun,
        chain: this.circuitBreaker.buildRootChain(),
      });

      executionIds.push(execution.id);
    }

    this.logger.log(
      `Dispatched ${executionIds.length} execution(s) for event "${payload.event}" in tenant ${tenantId}`,
    );

    return { dispatchedCount: executionIds.length, executionIds };
  }

  /**
   * Builds a deterministic idempotency key for a rule + payload combination.
   * Key = SHA-256(ruleId + entityId + event + minute-bucket).
   * The minute-bucket means the same event can re-trigger after >1 minute.
   */
  private buildIdempotencyKey(ruleId: string, payload: TriggerPayload): string {
    const minuteBucket = Math.floor(Date.now() / 60_000);
    const raw = `${ruleId}:${payload.event}:${payload.entityId}:${minuteBucket}`;
    return createHash('sha256').update(raw).digest('hex');
  }
}
