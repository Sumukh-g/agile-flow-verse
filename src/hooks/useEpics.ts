/**
 * Epic Hooks
 * 
 * React Query hooks for epic management operations.
 * Epics are large initiatives containing multiple stories/tasks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export interface Epic {
  id: string;
  name: string;
  description?: string;
  status: 'open' | 'in_progress' | 'done';
  color: string;
  priority: string;
  startDate?: string;
  targetDate?: string;
  progress: number;
  businessValue?: number;
  storyPoints?: number;
  projectId: string;
  project?: { id: string; name: string };
  metrics?: EpicMetrics;
  kanbanCards?: EpicCard[];
  _count?: {
    kanbanCards: number;
    tasks: number;
  };
}

export interface EpicMetrics {
  totalItems: number;
  totalPoints: number;
  completedItems: number;
  completedPoints: number;
  inProgressItems: number;
  remainingItems: number;
  remainingPoints: number;
  progress: number;
}

export interface EpicCard {
  id: string;
  title: string;
  status: string;
  storyPoints?: number;
  priority: string;
  sprint?: { id: string; name: string; status: string };
}

export interface RoadmapData {
  epics: Epic[];
  quarters: Record<string, Epic[]>;
  summary: {
    total: number;
    open: number;
    inProgress: number;
  };
}

// ============================================
// CACHE KEYS
// ============================================

export const epicKeys = {
  all: ['epics'] as const,
  byProject: (projectId: string) => [...epicKeys.all, 'project', projectId] as const,
  detail: (epicId: string) => [...epicKeys.all, 'detail', epicId] as const,
  roadmap: (projectId: string) => [...epicKeys.all, 'roadmap', projectId] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Get all epics for a project
 */
export function useEpics(projectId: string, options?: {
  status?: Epic['status'];
  includeItems?: boolean;
}) {
  return useQuery({
    queryKey: [...epicKeys.byProject(projectId), options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.includeItems) params.append('includeItems', 'true');
      
      const response = await apiClient.get<Epic[]>(`/epics/project/${projectId}?${params}`);
      return response;
    },
    staleTime: 30000,
    enabled: !!projectId
  });
}

/**
 * Get a single epic with details
 */
export function useEpic(epicId: string) {
  return useQuery({
    queryKey: epicKeys.detail(epicId),
    queryFn: async () => {
      const response = await apiClient.get<Epic>(`/epics/${epicId}`);
      return response;
    },
    staleTime: 30000,
    enabled: !!epicId
  });
}

/**
 * Get roadmap view for a project
 */
export function useRoadmap(projectId: string) {
  return useQuery({
    queryKey: epicKeys.roadmap(projectId),
    queryFn: async () => {
      const response = await apiClient.get<RoadmapData>(`/epics/project/${projectId}/roadmap`);
      return response;
    },
    staleTime: 60000,
    enabled: !!projectId
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new epic
 */
export function useCreateEpic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      projectId: string;
      name: string;
      description?: string;
      color?: string;
      priority?: string;
      startDate?: string;
      targetDate?: string;
      businessValue?: number;
    }) => {
      return apiClient.post<Epic>('/epics', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: epicKeys.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: epicKeys.roadmap(variables.projectId) });
    }
  });
}

/**
 * Update an epic
 */
export function useUpdateEpic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<{
      name: string;
      description: string;
      status: string;
      color: string;
      priority: string;
      startDate: string;
      targetDate: string;
      businessValue: number;
    }>) => {
      return apiClient.put<Epic>(`/epics/${id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: epicKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: epicKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: epicKeys.roadmap(data.projectId) });
    }
  });
}

/**
 * Add items to epic
 */
export function useAddToEpic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ epicId, itemIds, itemType }: {
      epicId: string;
      itemIds: string[];
      itemType: 'card' | 'task';
    }) => {
      return apiClient.post(`/epics/${epicId}/items`, { itemIds, itemType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: epicKeys.all });
    }
  });
}

/**
 * Remove items from epic
 */
export function useRemoveFromEpic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ epicId, itemIds, itemType }: {
      epicId: string;
      itemIds: string[];
      itemType: 'card' | 'task';
    }) => {
      return apiClient.delete(`/epics/${epicId}/items`, { data: { itemIds, itemType } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: epicKeys.all });
    }
  });
}

/**
 * Delete an epic
 */
export function useDeleteEpic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      return apiClient.delete(`/epics/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: epicKeys.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: epicKeys.roadmap(variables.projectId) });
    }
  });
}

