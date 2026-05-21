import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DecomposedStory {
  title: string;
  description: string;
  acceptanceCriteria: string;
  storyPoints: number;
  priority: string;
  suggestedSprint: number;
}

export interface EpicDecomposition {
  epicId: string;
  epicName: string;
  projectId: string;
  stories: DecomposedStory[];
  totalPoints: number;
  estimatedSprints: number;
  error?: string;
}

export interface EpicRiskSummary {
  total: number;
  onTrack: number;
  atRisk: number;
  critical: number;
}

export interface NLQueryResult {
  query: string;
  explanation?: string;
  model?: string;
  resultCount?: number;
  results: any[];
  error?: string;
}

export function useAiDecomposeEpic() {
  return useMutation({
    mutationFn: async ({ epicId, description }: { epicId: string; description: string }) => {
      const { data } = await apiClient.post(`/epics/${epicId}/ai/decompose`, { description });
      return data as EpicDecomposition;
    },
  });
}

export function useEpicRiskSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['epic-risk-summary', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/epics/project/${projectId}/risk-summary`);
      return data as EpicRiskSummary;
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useNaturalLanguageQuery() {
  return useMutation({
    mutationFn: async ({ projectId, query }: { projectId: string; query: string }) => {
      const { data } = await apiClient.post('/ai/query', { projectId, query });
      return data as NLQueryResult;
    },
  });
}
