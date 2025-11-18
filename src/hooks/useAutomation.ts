/**
 * Automation/Workflow Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Workflow, type CreateWorkflowDto, type UpdateWorkflowDto } from '@/lib/api';

// Query keys
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (projectId?: string) => [...workflowKeys.lists(), { projectId }] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
  executions: (id: string) => [...workflowKeys.detail(id), 'executions'] as const,
};

/**
 * Get all workflows
 */
export function useWorkflows(projectId?: string) {
  return useQuery({
    queryKey: workflowKeys.list(projectId),
    queryFn: () => api.automation.getWorkflows(projectId),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Get a single workflow
 */
export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => api.automation.getWorkflow(id),
    enabled: !!id,
    staleTime: 60000,
  });
}

/**
 * Create a new workflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkflowDto) => api.automation.createWorkflow(data),
    onSuccess: (newWorkflow) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.setQueryData<Workflow>(workflowKeys.detail(newWorkflow.id), newWorkflow);
      toast.success('Workflow created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create workflow');
    },
  });
}

/**
 * Update a workflow
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowDto }) =>
      api.automation.updateWorkflow(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.detail(id) });
      const previous = queryClient.getQueryData<Workflow>(workflowKeys.detail(id));

      if (previous) {
        queryClient.setQueryData<Workflow>(workflowKeys.detail(id), {
          ...previous,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previous };
    },
    onSuccess: (updatedWorkflow) => {
      queryClient.setQueryData<Workflow>(workflowKeys.detail(updatedWorkflow.id), updatedWorkflow);
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      toast.success('Workflow updated successfully');
    },
    onError: (error: any, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(workflowKeys.detail(id), context.previous);
      }
      toast.error(error?.apiError?.message || 'Failed to update workflow');
    },
  });
}

/**
 * Delete a workflow
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.automation.deleteWorkflow(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: workflowKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      toast.success('Workflow deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete workflow');
    },
  });
}

/**
 * Test a workflow
 */
export function useTestWorkflow() {
  return useMutation({
    mutationFn: ({ id, sampleData }: { id: string; sampleData: any }) =>
      api.automation.testWorkflow(id, sampleData),
    onSuccess: (result) => {
      if (result.conditionsMet) {
        toast.success(`Workflow test passed! ${result.actionsExecuted.length} action(s) would execute.`);
      } else {
        toast.info('Workflow conditions not met with provided sample data.');
      }
      
      if (result.errors.length > 0) {
        toast.error(`Errors detected: ${result.errors.join(', ')}`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to test workflow');
    },
  });
}

/**
 * Get workflow executions
 */
export function useWorkflowExecutions(workflowId: string, limit = 50) {
  return useQuery({
    queryKey: workflowKeys.executions(workflowId),
    queryFn: () => api.automation.getExecutions(workflowId, limit),
    enabled: !!workflowId,
    staleTime: 30000,
    retry: false, // Don't retry if endpoint doesn't exist yet
  });
}

