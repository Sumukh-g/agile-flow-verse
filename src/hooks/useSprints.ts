/**
 * Sprint Hooks
 * 
 * React Query hooks for sprint management operations.
 * Optimized with proper cache keys and stale times.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  velocity?: number;
  committedPoints?: number;
  wentWell?: string;
  needsImprovement?: string;
  actionItems?: string;
  projectId: string;
  project?: { id: string; name: string };
  metrics?: SprintMetrics;
  kanbanCards?: SprintCard[];
  _count?: {
    kanbanCards: number;
    tasks: number;
  };
}

export interface SprintMetrics {
  totalItems: number;
  totalPoints: number;
  completedPoints: number;
  inProgressPoints: number;
  remainingPoints: number;
  progress: number;
}

export interface SprintCard {
  id: string;
  title: string;
  status: string;
  storyPoints?: number;
  priority: string;
  epic?: { id: string; name: string; color: string };
}

export interface VelocityData {
  sprints: Array<{
    id: string;
    name: string;
    velocity: number;
    committedPoints: number;
    startDate: string;
    endDate: string;
  }>;
  averageVelocity: number;
  predictedCapacity: number;
}

export interface BurndownData {
  sprint: { id: string; name: string };
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  data: Array<{
    date: string;
    ideal: number;
    actual?: number;
  }>;
  startDate: string;
  endDate: string;
}

export interface BacklogData {
  cards: SprintCard[];
  tasks: any[];
  totalItems: number;
  totalPoints: number;
}

// ============================================
// CACHE KEYS
// ============================================

export const sprintKeys = {
  all: ['sprints'] as const,
  byProject: (projectId: string) => [...sprintKeys.all, 'project', projectId] as const,
  active: (projectId: string) => [...sprintKeys.byProject(projectId), 'active'] as const,
  detail: (sprintId: string) => [...sprintKeys.all, 'detail', sprintId] as const,
  burndown: (sprintId: string) => [...sprintKeys.all, 'burndown', sprintId] as const,
  velocity: (projectId: string) => [...sprintKeys.all, 'velocity', projectId] as const,
  backlog: (projectId: string) => [...sprintKeys.all, 'backlog', projectId] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Get all sprints for a project
 */
export function useSprints(projectId: string, options?: {
  status?: Sprint['status'];
  includeCards?: boolean;
}) {
  return useQuery({
    queryKey: [...sprintKeys.byProject(projectId), options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.includeCards) params.append('includeCards', 'true');
      
      const response = await apiClient.get<Sprint[]>(`/sprints/project/${projectId}?${params}`);
      return response;
    },
    staleTime: 30000, // 30 seconds
    enabled: !!projectId
  });
}

/**
 * Get active sprint for a project
 */
export function useActiveSprint(projectId: string) {
  return useQuery({
    queryKey: sprintKeys.active(projectId),
    queryFn: async () => {
      const response = await apiClient.get<Sprint | null>(`/sprints/project/${projectId}/active`);
      return response;
    },
    staleTime: 30000,
    enabled: !!projectId
  });
}

/**
 * Get a single sprint
 */
export function useSprint(sprintId: string) {
  return useQuery({
    queryKey: sprintKeys.detail(sprintId),
    queryFn: async () => {
      const response = await apiClient.get<Sprint>(`/sprints/${sprintId}`);
      return response;
    },
    staleTime: 30000,
    enabled: !!sprintId
  });
}

/**
 * Get burndown data for a sprint
 */
export function useSprintBurndown(sprintId: string) {
  return useQuery({
    queryKey: sprintKeys.burndown(sprintId),
    queryFn: async () => {
      const response = await apiClient.get<BurndownData>(`/sprints/${sprintId}/burndown`);
      return response;
    },
    staleTime: 60000, // 1 minute
    enabled: !!sprintId
  });
}

/**
 * Get velocity data for a project
 */
export function useVelocity(projectId: string, sprintCount: number = 6) {
  return useQuery({
    queryKey: [...sprintKeys.velocity(projectId), sprintCount],
    queryFn: async () => {
      const response = await apiClient.get<VelocityData>(`/sprints/project/${projectId}/velocity?count=${sprintCount}`);
      return response;
    },
    staleTime: 60000,
    enabled: !!projectId
  });
}

/**
 * Get backlog items for a project
 */
export function useBacklog(projectId: string) {
  return useQuery({
    queryKey: sprintKeys.backlog(projectId),
    queryFn: async () => {
      const response = await apiClient.get<BacklogData>(`/sprints/project/${projectId}/backlog`);
      return response;
    },
    staleTime: 30000,
    enabled: !!projectId
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new sprint
 */
export function useCreateSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      projectId: string;
      name: string;
      goal?: string;
      startDate: string;
      endDate: string;
    }) => {
      return apiClient.post<Sprint>('/sprints', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(variables.projectId) });
    }
  });
}

/**
 * Update a sprint
 */
export function useUpdateSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<{
      name: string;
      goal: string;
      startDate: string;
      endDate: string;
    }>) => {
      return apiClient.put<Sprint>(`/sprints/${id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(data.id) });
    }
  });
}

/**
 * Start a sprint
 */
export function useStartSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sprintId: string) => {
      return apiClient.post<Sprint>(`/sprints/${sprintId}/start`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.active(data.projectId) });
    }
  });
}

/**
 * Complete a sprint
 */
export function useCompleteSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...retrospective }: { 
      id: string;
      wentWell?: string;
      needsImprovement?: string;
      actionItems?: string;
    }) => {
      return apiClient.post<Sprint>(`/sprints/${id}/complete`, retrospective);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.active(data.projectId) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.velocity(data.projectId) });
    }
  });
}

/**
 * Add items to sprint
 */
export function useAddToSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sprintId, itemIds, itemType }: {
      sprintId: string;
      itemIds: string[];
      itemType: 'card' | 'task';
    }) => {
      return apiClient.post(`/sprints/${sprintId}/items`, { itemIds, itemType });
    },
    onSuccess: () => {
      // Invalidate all sprint-related queries
      queryClient.invalidateQueries({ queryKey: sprintKeys.all });
    }
  });
}

/**
 * Remove items from sprint
 */
export function useRemoveFromSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sprintId, itemIds, itemType }: {
      sprintId: string;
      itemIds: string[];
      itemType: 'card' | 'task';
    }) => {
      return apiClient.delete(`/sprints/${sprintId}/items`, { data: { itemIds, itemType } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all });
    }
  });
}

/**
 * Delete a sprint
 */
export function useDeleteSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      return apiClient.delete(`/sprints/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(variables.projectId) });
    }
  });
}

