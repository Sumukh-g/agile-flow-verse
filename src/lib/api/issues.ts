import { apiClient } from '../api-client';

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug' | 'feature' | 'task' | 'improvement';
  severity?: 'minor' | 'major' | 'critical' | 'blocker';
  assigneeId?: string;
  reporterId: string;
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  comments?: IssueComment[];
  attachments?: any[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface IssueComment {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateIssueDto {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  severity?: string;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  severity?: string;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface IssueQueryDto {
  projectId?: string;
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const issuesApi = {
  list: (query?: IssueQueryDto): Promise<{ items: Issue[]; total: number; hasMore: boolean }> =>
    apiClient.get('/issues', { params: query }),

  get: (id: string): Promise<Issue> =>
    apiClient.get(`/issues/${id}`),

  create: (data: CreateIssueDto): Promise<Issue> =>
    apiClient.post('/issues', data),

  update: (id: string, data: UpdateIssueDto): Promise<Issue> =>
    apiClient.put(`/issues/${id}`, data),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/issues/${id}`),

  addComment: (issueId: string, content: string): Promise<IssueComment> =>
    apiClient.post(`/issues/${issueId}/comments`, { content }),

  getComments: (issueId: string): Promise<IssueComment[]> =>
    apiClient.get(`/issues/${issueId}/comments`),
};

