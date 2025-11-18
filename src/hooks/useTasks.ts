import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  assignees?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  project?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  assigneeIds?: string[];
  dependencyIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  assigneeIds?: string[];
  dependencyIds?: string[];
}

export const useTasks = (projectId?: string) => {
  return useQuery({
    queryKey: ['tasks', projectId || 'all'],
    queryFn: async () => {
      const params = projectId ? { projectId } : {};
      const response = await apiClient.get<{ items: Task[]; nextCursor: string | null }>('/tasks', { params });
      return response.items || [];
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiClient.get<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTaskDto) => apiClient.post<Task>('/tasks', data),
    onSuccess: (_, variables) => {
      // Invalidate both project-specific tasks and all tasks
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      }
      // Always invalidate all tasks query so main Tasks page updates
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Also invalidate base tasks query
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      apiClient.put<Task>(`/tasks/${id}`, data),
    onSuccess: (_, { id, data }) => {
      // Invalidate all task queries to ensure sync
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      // If projectId changed, invalidate old project's tasks too
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
      }
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
    },
  });
}; 