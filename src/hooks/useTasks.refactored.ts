/**
 * Refactored Tasks Hooks using Service Layer
 * This replaces the old useTasks.ts implementation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTasksService } from '@/services/hooks/useTasksService';
import { taskKeys } from '@/services/tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '@/shared/types';
import { TaskWithRelations } from '@/services/tasks.service';
import { ServiceException } from '@/services/types/errors';
import { toast } from 'sonner';

/**
 * Get tasks with query filters
 */
export function useTasks(query?: TaskQueryDto) {
  const service = useTasksService();

  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => service.getTasks(query),
    staleTime: 30000, // 30 seconds - better than 0
    refetchOnMount: false, // Don't refetch on every mount
  });
}

/**
 * Get a single task by ID
 */
export function useTask(id: string) {
  const service = useTasksService();

  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => service.getTask(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const service = useTasksService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => service.createTask(data),
    onSuccess: (task, variables) => {
      // Service handles cache invalidation, but we can add additional logic here
      toast.success('Task created successfully');
    },
    onError: (error: unknown) => {
      const serviceError = error instanceof ServiceException ? error : ServiceException.fromApiError(error);
      toast.error(serviceError.message || 'Failed to create task');
    },
  });
}

/**
 * Update a task
 */
export function useUpdateTask() {
  const service = useTasksService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      service.updateTask(id, data),
    onSuccess: (task) => {
      toast.success('Task updated successfully');
    },
    onError: (error: unknown) => {
      const serviceError = error instanceof ServiceException ? error : ServiceException.fromApiError(error);
      toast.error(serviceError.message || 'Failed to update task');
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const service = useTasksService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => service.deleteTask(id),
    onSuccess: () => {
      toast.success('Task deleted successfully');
    },
    onError: (error: unknown) => {
      const serviceError = error instanceof ServiceException ? error : ServiceException.fromApiError(error);
      toast.error(serviceError.message || 'Failed to delete task');
    },
  });
}

// Re-export types for convenience
export type { TaskWithRelations as Task } from '@/services/tasks.service';

