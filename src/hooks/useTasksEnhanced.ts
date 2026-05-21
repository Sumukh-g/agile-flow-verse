/**
 * Enhanced Tasks Hooks with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Task, type CreateTaskDto, type UpdateTaskDto, type TaskQueryDto } from '@/lib/api';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskQueryDto) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

/**
 * Get all tasks
 */
export function useTasks(query?: TaskQueryDto) {
  return useQuery({
    queryKey: taskKeys.list(query || {}),
    queryFn: async () => {
      const response = await api.tasks.getTasks(query);
      // Return the data array, not the full response
      return response.data || [];
    },
    staleTime: 30000,
  });
}

/**
 * Get tasks by project
 */
export function useTasksByProject(projectId: string, query?: Omit<TaskQueryDto, 'projectId'>) {
  return useQuery({
    queryKey: taskKeys.list({ ...query, projectId }),
    queryFn: async () => {
      const response = await api.tasks.getTasksByProject(projectId, query);
      return response.data || [];
    },
    enabled: !!projectId,
    staleTime: 30000,
  });
}

/**
 * Get a single task
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => api.tasks.getTask(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => api.tasks.createTask(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard cache
      queryClient.setQueryData<Task>(taskKeys.detail(newTask.id), newTask);
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to create task');
    },
  });
}

/**
 * Update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      api.tasks.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      const previous = queryClient.getQueryData<Task>(taskKeys.detail(id));

      if (previous) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previous,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previous };
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task>(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard cache
      toast.success('Task updated successfully');
    },
    onError: (error: any, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.detail(id), context.previous);
      }
      toast.error(error?.apiError?.message || 'Failed to update task');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tasks.deleteTask(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard cache
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to delete task');
    },
  });
}

/**
 * Assign user to task
 */
export function useAssignUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      api.tasks.assignUser(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      toast.success('User assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to assign user');
    },
  });
}

/**
 * Unassign user from task
 */
export function useUnassignUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      api.tasks.unassignUser(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      toast.success('User unassigned successfully');
    },
    onError: (error: any) => {
      toast.error(error?.apiError?.message || 'Failed to unassign user');
    },
  });
}
