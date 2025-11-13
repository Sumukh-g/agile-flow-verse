import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CacheSync } from '@/lib/cache-sync';
import { useRealtimeInvalidation } from './useRealtime';
import { Task, CreateTaskDto, UpdateTaskDto } from './useTasks';

export const useTasksEnhanced = (projectId?: string) => {
  // Invalidate on real-time updates
  useRealtimeInvalidation('task.updated', [['tasks', projectId], ['tasks']]);
  useRealtimeInvalidation('task.created', [['tasks', projectId], ['tasks']]);
  useRealtimeInvalidation('task.deleted', [['tasks', projectId], ['tasks']]);

  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => apiClient.get<Task[]>('/tasks', { params: { projectId } }),
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTaskEnhanced = (id: string) => {
  useRealtimeInvalidation('task.updated', [['tasks', id]]);
  useRealtimeInvalidation('task.deleted', [['tasks', id]]);

  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiClient.get<Task>(`/tasks/${id}`),
    enabled: !!id,
    staleTime: 30000,
  });
};

export const useCreateTaskEnhanced = () => {
  const queryClient = useQueryClient();
  const cacheSync = new CacheSync(queryClient);
  
  return useMutation({
    mutationFn: async (data: CreateTaskDto) => {
      return cacheSync.optimisticUpdate<Task[]>(
        ['tasks', data.projectId],
        (old = []) => {
          const optimisticTask: Task = {
            id: `temp-${Date.now()}`,
            title: data.title,
            description: data.description,
            status: data.status || 'todo',
            priority: data.priority || 'medium',
            projectId: data.projectId,
            dueDate: data.dueDate,
            estimatedHours: data.estimatedHours,
            actualHours: data.actualHours || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return [...old, optimisticTask];
        },
        () => apiClient.post<Task>('/tasks', data),
        (error) => {
          console.error('Failed to create task:', error);
        },
      );
    },
    onSuccess: (newTask, variables) => {
      // Update cache with server response
      queryClient.setQueryData(['tasks', variables.projectId], (old: Task[] = []) => {
        const withoutTemp = old.filter(t => !t.id.startsWith('temp-'));
        return [...withoutTemp, newTask];
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
    },
  });
};

export const useUpdateTaskEnhanced = () => {
  const queryClient = useQueryClient();
  const cacheSync = new CacheSync(queryClient);
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskDto }) => {
      // Get current task to know projectId
      const currentTask = queryClient.getQueryData<Task>(['tasks', id]);
      
      return cacheSync.optimisticUpdate<Task>(
        ['tasks', id],
        (old) => {
          if (!old) return old;
          return { ...old, ...data, updatedAt: new Date().toISOString() };
        },
        () => apiClient.put<Task>(`/tasks/${id}`, data),
        (error) => {
          console.error('Failed to update task:', error);
        },
      );
    },
    onSuccess: (updatedTask, { id }) => {
      // Update specific task
      queryClient.setQueryData(['tasks', id], updatedTask);
      
      // Update in lists
      cacheSync.updateRelated('task', id, updatedTask);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (updatedTask.projectId) {
        queryClient.invalidateQueries({ queryKey: ['projects', updatedTask.projectId] });
      }
    },
  });
};

export const useDeleteTaskEnhanced = () => {
  const queryClient = useQueryClient();
  const cacheSync = new CacheSync(queryClient);
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get task before deletion to know projectId
      const task = queryClient.getQueryData<Task>(['tasks', id]);
      
      // Optimistically remove
      if (task?.projectId) {
        queryClient.setQueryData(['tasks', task.projectId], (old: Task[] = []) =>
          old.filter(t => t.id !== id)
        );
      }
      
      try {
        await apiClient.delete(`/tasks/${id}`);
        return { id, projectId: task?.projectId };
      } catch (error) {
        // Rollback on error
        if (task) {
          queryClient.setQueryData(['tasks', task.projectId], (old: Task[] = []) => [...old, task]);
        }
        throw error;
      }
    },
    onSuccess: ({ id, projectId }) => {
      // Remove from cache
      cacheSync.removeEntity('task', id);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      }
    },
  });
};

