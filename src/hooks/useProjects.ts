import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  budget?: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isPublic?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  progress?: number;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  progress?: number;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isPublic?: boolean;
}

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<{ items: Project[]; nextCursor: string | null }>('/projects');
      return response.items || [];
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiClient.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectDto) => apiClient.post<Project>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      apiClient.put<Project>(`/projects/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}; 