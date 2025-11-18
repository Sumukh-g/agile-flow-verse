/**
 * AI Agents Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Agent, type AgentRun, type RunAgentDto } from '@/lib/api';

// Query keys
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  runs: () => [...agentKeys.all, 'runs'] as const,
  runsList: (agentId?: string) => [...agentKeys.runs(), { agentId }] as const,
  runDetail: (id: string) => [...agentKeys.runs(), 'detail', id] as const,
};

/**
 * Get all agents
 */
export function useAgents() {
  return useQuery({
    queryKey: agentKeys.lists(),
    queryFn: () => api.agents.getAgents(),
    staleTime: 300000, // 5 minutes (agents don't change often)
    retry: false, // Don't retry if endpoint doesn't exist yet
  });
}

/**
 * Get a single agent
 */
export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => api.agents.getAgent(id),
    enabled: !!id,
    staleTime: 300000,
    retry: false,
  });
}

/**
 * Run an agent
 */
export function useRunAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RunAgentDto) => api.agents.runAgent(data),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.runs() });
      toast.success(`Agent "${run.agent?.name || 'Agent'}" executed successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to run agent');
    },
  });
}

/**
 * Get agent runs history
 */
export function useAgentRuns(agentId?: string, limit = 50) {
  return useQuery({
    queryKey: agentKeys.runsList(agentId),
    queryFn: () => api.agents.getAgentRuns(agentId, limit),
    staleTime: 30000,
    retry: false,
  });
}

/**
 * Get a specific agent run
 */
export function useAgentRun(id: string) {
  return useQuery({
    queryKey: agentKeys.runDetail(id),
    queryFn: () => api.agents.getAgentRun(id),
    enabled: !!id,
    staleTime: 60000,
    retry: false,
  });
}

// === AI Helper Hooks ===

/**
 * Generate tasks from description
 */
export function useGenerateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ description, projectId }: { description: string; projectId: string }) =>
      api.agents.ai.generateTasks(description, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tasks generated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to generate tasks');
    },
  });
}

/**
 * Summarize notes
 */
export function useSummarizeNotes() {
  return useMutation({
    mutationFn: (noteIds: string[]) => api.agents.ai.summarizeNotes(noteIds),
    onSuccess: () => {
      toast.success('Notes summarized successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to summarize notes');
    },
  });
}

/**
 * Generate project update
 */
export function useGenerateUpdate() {
  return useMutation({
    mutationFn: ({ projectId, timePeriod }: { projectId: string; timePeriod?: string }) =>
      api.agents.ai.generateUpdate(projectId, timePeriod),
    onSuccess: () => {
      toast.success('Update generated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to generate update');
    },
  });
}

/**
 * Analyze workflow
 */
export function useAnalyzeWorkflow() {
  return useMutation({
    mutationFn: (workflowId: string) => api.agents.ai.analyzeWorkflow(workflowId),
    onSuccess: () => {
      toast.success('Workflow analyzed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to analyze workflow');
    },
  });
}

