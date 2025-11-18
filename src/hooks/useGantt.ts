import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useGantt(projectId: string | undefined) {
  return useQuery({
    queryKey: ['gantt', projectId],
    enabled: !!projectId,
    queryFn: () => api.projectManagement.getGanttData(projectId!),
    staleTime: 60_000,
  });
}


