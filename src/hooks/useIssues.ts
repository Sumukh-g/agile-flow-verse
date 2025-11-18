import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Issue, CreateIssueDto, UpdateIssueDto, IssueQueryDto, IssueComment } from '@/lib/api/issues';

export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (query?: IssueQueryDto) => [...issueKeys.lists(), query] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
  comments: (issueId: string) => [...issueKeys.detail(issueId), 'comments'] as const,
};

export function useIssues(query?: IssueQueryDto) {
  return useQuery({
    queryKey: issueKeys.list(query),
    queryFn: () => api.issues.list(query),
    staleTime: 30000, // 30 seconds
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: () => api.issues.get(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIssueDto) => api.issues.create(data),
    onSuccess: (newIssue) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.list({ projectId: newIssue.projectId }) });
      queryClient.setQueryData(issueKeys.detail(newIssue.id), newIssue);
      toast.success('Issue created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to create issue');
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssueDto }) => api.issues.update(id, data),
    onSuccess: (updatedIssue) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.list({ projectId: updatedIssue.projectId }) });
      queryClient.setQueryData(issueKeys.detail(updatedIssue.id), updatedIssue);
      toast.success('Issue updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update issue');
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.issues.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      toast.success('Issue deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to delete issue');
    },
  });
}

export function useIssueComments(issueId: string) {
  return useQuery({
    queryKey: issueKeys.comments(issueId),
    queryFn: () => api.issues.getComments(issueId),
    enabled: !!issueId,
    staleTime: 30000,
  });
}

export function useAddIssueComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, content }: { issueId: string; content: string }) =>
      api.issues.addComment(issueId, content),
    onSuccess: (_, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.comments(issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add comment');
    },
  });
}

