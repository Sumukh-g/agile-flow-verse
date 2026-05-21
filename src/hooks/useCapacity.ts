import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SprintCapacity {
  id: string;
  sprintId: string;
  userId: string;
  dailyHours: number;
  leaveDays: number;
  skills: string[];
  user?: { id: string; name: string; email: string };
}

export interface CapacityData {
  capacities: SprintCapacity[];
  sprintDays: number;
  totalHours: number;
}

export interface CapacityVsLoad extends CapacityData {
  committedPoints: number;
  committedLoad: number;
  avgHoursPerPoint: number;
  utilizationPercent: number;
}

const capacityKeys = {
  all: ['capacity'] as const,
  sprint: (sprintId: string) => [...capacityKeys.all, sprintId] as const,
  load: (sprintId: string) => [...capacityKeys.all, 'load', sprintId] as const,
};

export function useCapacity(sprintId: string | undefined) {
  return useQuery({
    queryKey: capacityKeys.sprint(sprintId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/${sprintId}/capacity`);
      return data as CapacityData;
    },
    enabled: !!sprintId,
    staleTime: 30_000,
  });
}

export function useCapacityVsLoad(sprintId: string | undefined) {
  return useQuery({
    queryKey: capacityKeys.load(sprintId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/${sprintId}/capacity/load`);
      return data as CapacityVsLoad;
    },
    enabled: !!sprintId,
    staleTime: 30_000,
  });
}

export function useSetCapacity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, userId, dailyHours, leaveDays, skills }: {
      sprintId: string;
      userId: string;
      dailyHours?: number;
      leaveDays?: number;
      skills?: string[];
    }) => {
      const { data } = await apiClient.post(`/sprints/${sprintId}/capacity`, { userId, dailyHours, leaveDays, skills });
      return data;
    },
    onSuccess: (_, { sprintId }) => {
      qc.invalidateQueries({ queryKey: capacityKeys.sprint(sprintId) });
      qc.invalidateQueries({ queryKey: capacityKeys.load(sprintId) });
    },
  });
}
