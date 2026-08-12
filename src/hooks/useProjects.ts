import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';

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
  const { user } = useAuth();
  const userKey = user?.id || 'anonymous';

  return useQuery({
    // Include user in the key to avoid cross-account cache bleed
    queryKey: ['projects', userKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ items: Project[]; nextCursor: string | null }>('/projects');
        // apiClient.get typically returns { data, status, ... }, so prefer data if present
        const payload: any = (response as any)?.data ?? response;

        // Handle both wrapped and unwrapped responses
        if (Array.isArray(payload)) {
          return payload;
        }
        if (payload && typeof payload === 'object') {
          // If payload has items, return them; else if payload looks like a single project, wrap it
          if ('items' in payload && Array.isArray((payload as any).items)) {
            return (payload as any).items as Project[];
          }
          if ('id' in payload) {
            return [payload as Project];
          }
        }
        return []; // Return empty array if response is unexpected
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        // Return empty array on error instead of throwing to prevent undefined
        return [];
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
  });
};

export const useProject = (id: string) => {
  const { user } = useAuth();
  const userKey = user?.id || 'anonymous';

  return useQuery({
    // Include user in the key to avoid cross-account cache bleed
    queryKey: ['projects', userKey, id],
    queryFn: async () => {
      if (!id) {
        return null; // Return null instead of undefined
      }
      try {
        const response = await apiClient.get<Project>(`/projects/${id}`);
        const payload: any = (response as any)?.data ?? response;
        // Ensure we always return a value, never undefined
        return payload || null;
      } catch (error) {
        console.error(`Failed to fetch project ${id}:`, error);
        // Return null on error instead of throwing to prevent undefined
        // The error will still be available in the query's error state
        return null;
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard cache
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard cache
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard cache
    },
  });
}; 