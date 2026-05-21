import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface StoryPointEstimate {
  estimate: number | null;
  confidence: 'high' | 'medium' | 'low';
  range: [number, number];
  reasoning: string;
  similarCards: { title: string; points: number }[];
}

export interface DuplicateResult {
  duplicates: { cardId: string; title: string; status: string; similarity: number }[];
  hasDuplicates: boolean;
}

export function useAiEstimatePoints() {
  return useMutation({
    mutationFn: async ({ projectId, title, description }: {
      projectId: string;
      title: string;
      description?: string;
    }) => {
      const { data } = await apiClient.post('/ai/estimate-points', { projectId, title, description });
      return data as StoryPointEstimate;
    },
  });
}

export function useAiFindDuplicates() {
  return useMutation({
    mutationFn: async ({ projectId, title, description }: {
      projectId: string;
      title: string;
      description?: string;
    }) => {
      const { data } = await apiClient.post('/ai/find-duplicates', { projectId, title, description });
      return data as DuplicateResult;
    },
  });
}
