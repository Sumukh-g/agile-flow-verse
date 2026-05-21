import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { automationApi, AutomationRule, CreateRuleDto, UpdateRuleDto, TriggerKey, ActionKey, TRIGGER_META, ACTION_META } from '@/lib/api/automation';

// Re-export types used across the UI
export type {
  AutomationRule,
  CreateRuleDto,
  UpdateRuleDto,
  TriggerKey,
  ActionKey,
  ConditionNode,
  ConditionLeaf,
  ConditionGroup,
  ActionStep,
  ActionLeaf,
  BranchNode,
  AutomationExecution,
  AutomationExecutionDetail,
  AutomationStepLog,
  ExecutionStatus,
} from '@/lib/api/automation';
export { TRIGGER_META, ACTION_META } from '@/lib/api/automation';

// ─── Query keys ───────────────────────────────────────────────────────────────
export const automationKeys = {
  all:        ['automations'] as const,
  rules:      ()              => [...automationKeys.all, 'rules'] as const,
  rule:       (id: string)    => [...automationKeys.all, 'rule', id] as const,
  executions: (ruleId?: string) => [...automationKeys.all, 'executions', ruleId ?? 'all'] as const,
  execution:  (id: string)    => [...automationKeys.all, 'execution', id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAutomationRules(projectId?: string) {
  return useQuery({
    queryKey: automationKeys.rules(),
    queryFn: () => automationApi.getRules(projectId),
    staleTime: 30_000,
    retry: 2,
  });
}

export function useAutomationRule(id: string) {
  return useQuery({
    queryKey: automationKeys.rule(id),
    queryFn: () => automationApi.getRule(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useAutomationExecutions(ruleId?: string, limit = 50) {
  return useQuery({
    queryKey: automationKeys.executions(ruleId),
    queryFn: () => automationApi.getExecutions(ruleId, limit),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useAutomationExecution(id: string) {
  return useQuery({
    queryKey: automationKeys.execution(id),
    queryFn: () => automationApi.getExecution(id),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRuleDto) => automationApi.createRule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.rules() });
    },
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateRuleDto) =>
      automationApi.updateRule(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: automationKeys.rules() });
      qc.invalidateQueries({ queryKey: automationKeys.rule(variables.id) });
    },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationApi.deleteRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.rules() });
    },
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      automationApi.toggleRule(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.rules() });
    },
  });
}

export function useDryRunRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, samplePayload }: { id: string; samplePayload?: Record<string, unknown> }) =>
      automationApi.dryRun(id, samplePayload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: automationKeys.executions() });
      qc.invalidateQueries({ queryKey: automationKeys.executions(variables.id) });
    },
  });
}

export function useReplayExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dryRun }: { id: string; dryRun?: boolean }) =>
      automationApi.replay(id, dryRun),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.executions() });
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTriggerLabel(key: TriggerKey): string {
  return TRIGGER_META[key]?.label ?? key;
}

export function getActionLabel(key: ActionKey): string {
  return ACTION_META[key]?.label ?? key;
}

// Legacy aliases used by old WorkflowBuilder (keeps it compiling)
export const useWorkflows = useAutomationRules;
export const useCreateWorkflow = useCreateRule;
export const useUpdateWorkflow = useUpdateRule;
export const useDeleteWorkflow = useDeleteRule;
export const useToggleWorkflow = useToggleRule;
export const useTestWorkflow = useDryRunRule;
