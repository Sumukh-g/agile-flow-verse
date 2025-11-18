import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type CrmClient, type CrmDeal, type CrmProject, type CrmSummary } from '@/lib/api';

export const crmKeys = {
  all: ['crm'] as const,
  clients: () => [...crmKeys.all, 'clients'] as const,
  client: (id: string) => [...crmKeys.clients(), id] as const,
  projects: () => [...crmKeys.all, 'projects'] as const,
  project: (id: string) => [...crmKeys.projects(), id] as const,
  deals: () => [...crmKeys.all, 'deals'] as const,
  deal: (id: string) => [...crmKeys.deals(), id] as const,
  summary: () => [...crmKeys.all, 'summary'] as const,
};

// Clients
export function useCrmClients() {
  return useQuery({
    queryKey: crmKeys.clients(),
    queryFn: () => api.crm.listClients(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCrmClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CrmClient>) => api.crm.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.clients() });
      queryClient.invalidateQueries({ queryKey: crmKeys.projects() });
      queryClient.invalidateQueries({ queryKey: crmKeys.summary() });
      toast.success('Client created');
    },
  });
}

export function useUpdateCrmClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmClient> }) =>
      api.crm.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.clients() });
      queryClient.invalidateQueries({ queryKey: crmKeys.projects() });
      queryClient.invalidateQueries({ queryKey: crmKeys.deals() });
      queryClient.invalidateQueries({ queryKey: crmKeys.summary() });
      toast.success('Client updated');
    },
  });
}

export function useDeleteCrmClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.crm.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.clients() });
      toast.success('Client deleted');
    },
  });
}

// CRM Projects
export function useCrmProjects() {
  return useQuery({
    queryKey: crmKeys.projects(),
    queryFn: () => api.crm.listCrmProjects(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useCrmProject(id: string) {
  return useQuery({
    queryKey: crmKeys.project(id),
    queryFn: () => api.crm.getCrmProject(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateCrmProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CrmProject>) => api.crm.createCrmProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.projects() });
      queryClient.invalidateQueries({ queryKey: crmKeys.clients() });
      queryClient.invalidateQueries({ queryKey: crmKeys.summary() });
      toast.success('CRM project created');
    },
  });
}

export function useUpdateCrmProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmProject> }) =>
      api.crm.updateCrmProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.projects() });
      queryClient.invalidateQueries({ queryKey: crmKeys.clients() });
      queryClient.invalidateQueries({ queryKey: crmKeys.deals() });
      queryClient.invalidateQueries({ queryKey: crmKeys.summary() });
      toast.success('CRM project updated');
    },
  });
}

export function useDeleteCrmProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.crm.deleteCrmProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.projects() });
      toast.success('CRM project deleted');
    },
  });
}

// Deals
export function useCrmDeals() {
  return useQuery({
    queryKey: crmKeys.deals(),
    queryFn: () => api.crm.listDeals(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCrmDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CrmDeal>) => api.crm.createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.deals() });
      queryClient.invalidateQueries({ queryKey: crmKeys.clients() });
      queryClient.invalidateQueries({ queryKey: crmKeys.projects() });
      queryClient.invalidateQueries({ queryKey: crmKeys.summary() });
      toast.success('Deal created');
    },
  });
}

export function useUpdateCrmDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmDeal> }) =>
      api.crm.updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.deals() });
      queryClient.invalidateQueries({ queryKey: crmKeys.clients() });
      queryClient.invalidateQueries({ queryKey: crmKeys.projects() });
      queryClient.invalidateQueries({ queryKey: crmKeys.summary() });
      toast.success('Deal updated');
    },
  });
}

export function useDeleteCrmDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.crm.deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.deals() });
      queryClient.invalidateQueries({ queryKey: crmKeys.summary() });
      toast.success('Deal deleted');
    },
  });
}

// Summary
export function useCrmSummary() {
  return useQuery({
    queryKey: crmKeys.summary(),
    queryFn: () => api.crm.getSummary(),
    staleTime: 30000,
  });
}

