import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SprintReviewAttendee {
  userId: string;
  name: string;
  role: string;
}

export interface DemonstratedItem {
  cardId: string;
  title: string;
  accepted: boolean;
  feedback?: string;
}

export interface SprintReview {
  id: string;
  sprintId: string;
  attendees: SprintReviewAttendee[];
  demonstratedItems: DemonstratedItem[];
  stakeholderNotes?: string;
  reviewDate: string;
  createdAt: string;
}

const reviewKeys = {
  all: ['sprint-review'] as const,
  detail: (sprintId: string) => [...reviewKeys.all, sprintId] as const,
};

export function useSprintReview(sprintId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.detail(sprintId || ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sprints/${sprintId}/review`);
      return data as SprintReview | null;
    },
    enabled: !!sprintId,
    staleTime: 30_000,
  });
}

export function useCreateSprintReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, ...data }: {
      sprintId: string;
      attendees: SprintReviewAttendee[];
      demonstratedItems: DemonstratedItem[];
      stakeholderNotes?: string;
      reviewDate: string;
    }) => {
      const { data: result } = await apiClient.post(`/sprints/${sprintId}/review`, data);
      return result;
    },
    onSuccess: (_, { sprintId }) => {
      qc.invalidateQueries({ queryKey: reviewKeys.detail(sprintId) });
    },
  });
}

export function useUpdateSprintReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, ...data }: { sprintId: string; [key: string]: any }) => {
      const { data: result } = await apiClient.put(`/sprints/${sprintId}/review`, data);
      return result;
    },
    onSuccess: (_, { sprintId }) => {
      qc.invalidateQueries({ queryKey: reviewKeys.detail(sprintId) });
    },
  });
}
