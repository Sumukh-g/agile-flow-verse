import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DoDItem {
  id: string;
  label: string;
  required: boolean;
}

export interface DoDCheck {
  id: string;
  cardId: string;
  itemId: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
}

export interface DoDStatus {
  complete: boolean;
  missing: string[];
}

const dodKeys = {
  all: ['dod'] as const,
  project: (projectId: string) => [...dodKeys.all, 'project', projectId] as const,
  cardChecks: (cardId: string) => [...dodKeys.all, 'card', cardId] as const,
  cardStatus: (cardId: string) => [...dodKeys.all, 'status', cardId] as const,
};

export function useDoD(projectId: string | undefined) {
  return useQuery({
    queryKey: dodKeys.project(projectId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/project/${projectId}/dod`);
      return data as { items: DoDItem[]; projectId: string };
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useSetDoD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, items }: { projectId: string; items: DoDItem[] }) => {
      const { data } = await apiClient.post(`/sprints/project/${projectId}/dod`, { items });
      return data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: dodKeys.project(projectId) });
    },
  });
}

export function useDoDChecks(cardId: string | undefined) {
  return useQuery({
    queryKey: dodKeys.cardChecks(cardId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/cards/${cardId}/dod-checks`);
      return data as DoDCheck[];
    },
    enabled: !!cardId,
    staleTime: 10_000,
  });
}

export function useToggleDoDCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, itemId }: { cardId: string; itemId: string }) => {
      const { data } = await apiClient.post(`/sprints/cards/${cardId}/dod-checks/${itemId}/toggle`);
      return data;
    },
    onSuccess: (_, { cardId }) => {
      qc.invalidateQueries({ queryKey: dodKeys.cardChecks(cardId) });
      qc.invalidateQueries({ queryKey: dodKeys.cardStatus(cardId) });
    },
  });
}

export function useDoDStatus(cardId: string | undefined) {
  return useQuery({
    queryKey: dodKeys.cardStatus(cardId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/cards/${cardId}/dod-status`);
      return data as DoDStatus;
    },
    enabled: !!cardId,
    staleTime: 10_000,
  });
}
