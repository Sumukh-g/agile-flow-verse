import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useBurndownReport(projectId: string | undefined, startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['reports', 'burndown', { projectId, startDate, endDate, groupBy }],
    enabled: !!projectId,
    queryFn: () => api.reports.getBurndown({ projectId: projectId!, startDate, endDate, groupBy }),
    staleTime: 60_000,
  });
}

export function useVelocityReport(projectId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'velocity', { projectId, startDate, endDate }],
    queryFn: () => api.reports.getVelocity({ projectId, startDate, endDate }),
    staleTime: 60_000,
  });
}

export function useCapacityReport(projectId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'capacity', { projectId, startDate, endDate }],
    queryFn: () => api.reports.getCapacity({ projectId, startDate, endDate }),
    staleTime: 60_000,
  });
}

export function useTimeTrackingReport(projectId: string | undefined, startDate: string, endDate: string, userId?: string, includeDetails?: boolean) {
  return useQuery({
    queryKey: ['reports', 'time', { projectId, startDate, endDate, userId, includeDetails }],
    queryFn: () => api.reports.getTimeTracking({ projectId, startDate, endDate, userId, includeDetails }),
    staleTime: 60_000,
  });
}


