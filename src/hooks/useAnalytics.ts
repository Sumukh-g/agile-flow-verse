import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProjectAnalytics(projectId: string | undefined, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'project', projectId, { startDate, endDate }],
    enabled: !!projectId,
    queryFn: () => api.analytics.getProjectAnalytics(projectId!, { startDate, endDate }),
    staleTime: 60_000,
  });
}

export function usePerformanceMetrics(projectId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: ['analytics', 'performance', projectId, days],
    enabled: !!projectId,
    queryFn: () => api.analytics.getPerformanceMetrics(projectId, days),
    staleTime: 60_000,
  });
}

export function useForecast(projectId: string | undefined, targetDate: string) {
  return useQuery({
    queryKey: ['analytics', 'forecast', projectId, targetDate],
    enabled: !!projectId && !!targetDate,
    queryFn: () => api.analytics.getForecast(projectId!, targetDate),
    staleTime: 60_000,
  });
}

