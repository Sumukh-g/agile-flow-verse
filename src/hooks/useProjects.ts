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
      try {
        const response = await apiClient.get<{ items: Project[]; nextCursor: string | null }>('/projects');
        // Handle both wrapped and unwrapped responses
        if (Array.isArray(response)) {
          return response;
        }
        return response.items || [];
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      try {
        console.log(`Fetching project with ID: ${id}`);
        const response = await apiClient.get<Project>(`/projects/${id}`);
        console.log(`Project fetched:`, response);
        return response;
      } catch (error) {
        console.error(`Failed to fetch project ${id}:`, error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1, // Retry once on failure
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary calls
    // Ensure cache is properly invalidated when id changes
    gcTime: 0, // Don't keep stale data in cache
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