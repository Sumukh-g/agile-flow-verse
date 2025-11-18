import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Form, type FormResponse, type FormShare } from '@/lib/api';

export const formKeys = {
  all: ['forms'] as const,
  lists: () => [...formKeys.all, 'list'] as const,
  list: (projectId?: string) => [...formKeys.lists(), projectId] as const,
  details: () => [...formKeys.all, 'detail'] as const,
  detail: (id: string) => [...formKeys.details(), id] as const,
  responses: (id: string) => [...formKeys.all, 'responses', id] as const,
  shares: (id: string) => [...formKeys.all, 'shares', id] as const,
};

export function useForms(projectId?: string) {
  return useQuery({
    queryKey: formKeys.list(projectId),
    queryFn: () => api.forms.list(projectId),
    staleTime: 30000,
  });
}

export function useForm(id: string) {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: () => api.forms.get(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Form>) => api.forms.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success('Form created successfully');
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Form> }) =>
      api.forms.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formKeys.detail(variables.id) });
      toast.success('Form updated successfully');
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.forms.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success('Form deleted successfully');
    },
  });
}

export function useSubmitFormResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      api.forms.submitResponse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: formKeys.responses(variables.id) });
      toast.success('Response submitted successfully');
    },
  });
}

export function useFormResponses(id: string) {
  return useQuery({
    queryKey: formKeys.responses(id),
    queryFn: () => api.forms.listResponses(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useShareForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { userId?: string; access: 'view' | 'respond' | 'edit'; expiresAt?: string } }) =>
      api.forms.share(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formKeys.shares(variables.id) });
      toast.success('Form shared successfully');
    },
  });
}

export function useFormShares(id: string) {
  return useQuery({
    queryKey: formKeys.shares(id),
    queryFn: () => api.forms.listShares(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useDeleteFormShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => api.forms.deleteShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.shares });
      toast.success('Share removed successfully');
    },
  });
}

