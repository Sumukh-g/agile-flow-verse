/**
 * Enhanced Dashboard Hooks with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { api, type DashboardStats } from '@/lib/api';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  project: (projectId: string) => [...dashboardKeys.all, 'project', projectId] as const,
};

/**
 * Get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time feel
  });
}

/**
 * Get project-specific dashboard data
 */
export function useProjectDashboard(projectId: string) {
  return useQuery({
    queryKey: dashboardKeys.project(projectId),
    queryFn: () => api.dashboard.getProjectDashboard(projectId),
    enabled: !!projectId,
    staleTime: 30000,
  });
}

