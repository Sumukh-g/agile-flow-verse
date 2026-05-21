/**
 * Gantt Hooks
 * React Query hooks for Gantt chart operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ganttApi, GanttTask, GanttData } from '@/lib/api/gantt';

/**
 * Get Gantt chart data for a project
 */
export function useGantt(projectId: string | undefined) {
  return useQuery({
    queryKey: ['gantt', projectId],
    queryFn: () => ganttApi.getGanttData(projectId!),
    enabled: !!projectId,
    staleTime: 0,
    refetchOnMount: true,
  });
}

/**
 * Create a new Gantt task
 */
export function useCreateGanttTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<GanttTask> }) =>
      ganttApi.createTask(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create task');
    },
  });
}

/**
 * Update a Gantt task
 */
export function useUpdateGanttTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      taskId,
      data,
    }: {
      projectId: string;
      taskId: string;
      data: Partial<GanttTask>;
    }) => ganttApi.updateTask(projectId, taskId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to update task');
    },
  });
}

/**
 * Delete a Gantt task
 */
export function useDeleteGanttTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      ganttApi.deleteTask(projectId, taskId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete task');
    },
  });
}

/**
 * Update task schedule (dates)
 */
export function useUpdateGanttTaskSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      taskId,
      startDate,
      endDate,
    }: {
      projectId: string;
      taskId: string;
      startDate: string;
      endDate: string;
    }) => ganttApi.updateTaskSchedule(projectId, taskId, startDate, endDate),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to update task schedule');
    },
  });
}

/**
 * Create a dependency between two tasks
 */
export function useCreateGanttDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      fromTaskId,
      toTaskId,
      type,
      lag,
    }: {
      projectId: string;
      fromTaskId: string;
      toTaskId: string;
      type?: string;
      lag?: number;
    }) => ganttApi.createDependency(projectId, fromTaskId, toTaskId, type, lag),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
      toast.success('Dependency created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create dependency');
    },
  });
}

/**
 * Delete a dependency
 */
export function useDeleteGanttDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, dependencyId }: { projectId: string; dependencyId: string }) =>
      ganttApi.deleteDependency(projectId, dependencyId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
      toast.success('Dependency deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete dependency');
    },
  });
}
