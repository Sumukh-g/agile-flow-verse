import { apiClient } from '../api-client';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'rating' | 'scale' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  min?: number; // For scale/rating
  max?: number; // For scale/rating
  step?: number; // For scale
}

export interface FormSettings {
  allowAnonymous?: boolean;
  requireLogin?: boolean;
  sendConfirmation?: boolean;
  limitResponses?: boolean;
  maxResponses?: number;
}

export interface Form {
  id: string;
  tenantId: string;
  projectId?: string;
  title: string;
  description?: string;
  fields: FormField[];
  status: 'draft' | 'active' | 'closed' | 'archived';
  type?: 'survey' | 'feedback' | 'bug-report' | 'requirements' | 'review' | 'application';
  settings: FormSettings;
  isPublic: boolean;
  views: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; email: string };
  project?: { id: string; name: string };
  responses?: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedBy?: string;
  data: Record<string, any>;
  submittedAt: string;
  user?: { id: string; name: string; email: string };
}

export interface FormShare {
  id: string;
  formId: string;
  userId?: string;
  access: 'view' | 'respond' | 'edit';
  shareLink?: string;
  expiresAt?: string;
  user?: { id: string; name: string; email: string };
}

export const formsApi = {
  list: (projectId?: string): Promise<Form[]> =>
    apiClient.get('/forms', { params: projectId ? { projectId } : {} }),

  get: (id: string): Promise<Form> =>
    apiClient.get(`/forms/${id}`),

  create: (data: Partial<Form>): Promise<Form> =>
    apiClient.post('/forms', data),

  update: (id: string, data: Partial<Form>): Promise<Form> =>
    apiClient.put(`/forms/${id}`, data),

  delete: (id: string): Promise<{ ok: boolean }> =>
    apiClient.delete(`/forms/${id}`),

  submitResponse: (id: string, data: Record<string, any>): Promise<FormResponse> =>
    apiClient.post(`/forms/${id}/responses`, { data }),

  listResponses: (id: string): Promise<FormResponse[]> =>
    apiClient.get(`/forms/${id}/responses`),

  share: (id: string, data: { userId?: string; access: 'view' | 'respond' | 'edit'; expiresAt?: string }): Promise<FormShare> =>
    apiClient.post(`/forms/${id}/shares`, data),

  listShares: (id: string): Promise<FormShare[]> =>
    apiClient.get(`/forms/${id}/shares`),

  deleteShare: (shareId: string): Promise<{ ok: boolean }> =>
    apiClient.delete(`/forms/shares/${shareId}`),

  incrementViews: (id: string): Promise<{ ok: boolean }> =>
    apiClient.post(`/forms/${id}/views`),
};

