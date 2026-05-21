import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SprintRecommendation {
  recommendation: {
    selectedItemIds: string[];
    totalPoints: number;
    reasoning: string;
    risks: string[];
    capacityUsed: number;
  };
  backlogItems: any[];
  velocity: { average: number; recommended: number };
}

export interface ScopeCreepData {
  sprintId: string;
  sprintName: string;
  originalCommitted: number;
  currentTotal: number;
  scopeChanges: number;
  addedItems: { id: string; title: string; points: number }[];
  addedPoints: number;
  creepPercentage: number;
}

export interface RiskAnalysis {
  sprintId: string;
  sprintName: string;
  riskLevel: string;
  metrics: {
    totalDays: number;
    elapsed: number;
    remaining: number;
    progressPercent: number;
    totalPoints: number;
    completedPoints: number;
    remainingPoints: number;
    deviation: number;
  };
  risks: string[];
  suggestions: string[];
  stuckCards: { id: string; title: string; points: number; status: string }[];
  descopeCandidates: { id: string; title: string; points: number }[];
}

export interface RetroInsights {
  prompts: string[];
  patterns: string[];
  suggestedWentWell: string;
  suggestedNeedsImprovement: string;
  recommendedActionItems: string[];
}

const aiSprintKeys = {
  recommend: (sprintId: string) => ['ai-sprint', 'recommend', sprintId] as const,
  scopeCreep: (sprintId: string) => ['ai-sprint', 'scope-creep', sprintId] as const,
  risk: (sprintId: string) => ['ai-sprint', 'risk', sprintId] as const,
};

export function useAiRecommendSprint() {
  return useMutation({
    mutationFn: async ({ sprintId, projectId }: { sprintId: string; projectId: string }) => {
      const { data } = await apiClient.post(`/sprints/${sprintId}/ai/recommend`, { projectId });
      return data as SprintRecommendation;
    },
  });
}

export function useScopeCreep(sprintId: string | undefined) {
  return useQuery({
    queryKey: aiSprintKeys.scopeCreep(sprintId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/${sprintId}/ai/scope-creep`);
      return data as ScopeCreepData;
    },
    enabled: !!sprintId,
    staleTime: 60_000,
  });
}

export function useSprintRiskAnalysis(sprintId: string | undefined) {
  return useQuery({
    queryKey: aiSprintKeys.risk(sprintId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/${sprintId}/ai/risk-analysis`);
      return data as RiskAnalysis;
    },
    enabled: !!sprintId,
    staleTime: 60_000,
  });
}

export function useAiRetroInsights() {
  return useMutation({
    mutationFn: async ({ sprintId }: { sprintId: string }) => {
      const { data } = await apiClient.post(`/sprints/${sprintId}/ai/retro-insights`);
      return data as RetroInsights;
    },
  });
}
