import { apiClient } from '../api-client';
import { CrmClient, CrmDeal, CrmProject, CrmSummary } from './types';

export const crmApi = {
  // Clients
  listClients(): Promise<CrmClient[]> {
    return apiClient.get('/crm/clients');
  },
  getClient(id: string): Promise<CrmClient> {
    return apiClient.get(`/crm/clients/${id}`);
  },
  createClient(data: Partial<CrmClient>): Promise<CrmClient> {
    return apiClient.post('/crm/clients', data);
  },
  updateClient(id: string, data: Partial<CrmClient>): Promise<CrmClient> {
    return apiClient.put(`/crm/clients/${id}`, data);
  },
  deleteClient(id: string): Promise<void> {
    return apiClient.delete(`/crm/clients/${id}`);
  },

  // CRM Projects
  listCrmProjects(): Promise<CrmProject[]> {
    return apiClient.get('/crm/projects');
  },
  getCrmProject(id: string): Promise<CrmProject> {
    return apiClient.get(`/crm/projects/${id}`);
  },
  createCrmProject(data: Partial<CrmProject>): Promise<CrmProject> {
    return apiClient.post('/crm/projects', data);
  },
  updateCrmProject(id: string, data: Partial<CrmProject>): Promise<CrmProject> {
    return apiClient.put(`/crm/projects/${id}`, data);
  },
  deleteCrmProject(id: string): Promise<void> {
    return apiClient.delete(`/crm/projects/${id}`);
  },

  // Deals
  listDeals(): Promise<CrmDeal[]> {
    return apiClient.get('/crm/deals');
  },
  getDeal(id: string): Promise<CrmDeal> {
    return apiClient.get(`/crm/deals/${id}`);
  },
  createDeal(data: Partial<CrmDeal>): Promise<CrmDeal> {
    return apiClient.post('/crm/deals', data);
  },
  updateDeal(id: string, data: Partial<CrmDeal>): Promise<CrmDeal> {
    return apiClient.put(`/crm/deals/${id}`, data);
  },
  deleteDeal(id: string): Promise<void> {
    return apiClient.delete(`/crm/deals/${id}`);
  },

  // Summary
  getSummary(): Promise<CrmSummary> {
    return apiClient.get('/crm/summary');
  },

  // Meetings
  scheduleMeeting(data: { clientId: string; start: string; title?: string; notes?: string }): Promise<{
    ok: boolean;
    meetingLink: string;
    email: string;
    subject: string;
    body: string;
  }> {
    return apiClient.post('/crm/meetings', data);
  },
};

