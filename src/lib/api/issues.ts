import { apiClient } from '../api-client';

export type IssueStatus = 
  | 'INBOX'
  | 'NEEDS_INFO'
  | 'TRIAGED'
  | 'PLANNED'
  | 'READY_FOR_DEV'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'IN_QA'
  | 'DONE'
  | 'WONT_DO'
  | 'DUPLICATE'
  | 'ON_HOLD';

export type IssueType = 'BUG' | 'STORY' | 'TASK' | 'INCIDENT' | 'SUPPORT';
export type IssuePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type IssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  severity?: IssueSeverity;
  assigneeId?: string;
  reporterId: string;
  componentId?: string;
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
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  severity?: IssueSeverity;
  assigneeId?: string;
  componentId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  severity?: IssueSeverity;
  assigneeId?: string;
  componentId?: string;
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

// ============================================
// Issue Link Types
// ============================================

export type IssueLinkType = 
  | 'BLOCKS'
  | 'IS_BLOCKED_BY'
  | 'DUPLICATES'
  | 'IS_DUPLICATED_BY'
  | 'RELATES_TO';

export interface IssueLink {
  id: string;
  sourceIssueId: string;
  targetIssueId: string;
  linkType: IssueLinkType;
  createdAt: string;
  sourceIssue?: { id: string; title: string; status?: IssueStatus; priority?: IssuePriority };
  targetIssue?: { id: string; title: string; status?: IssueStatus; priority?: IssuePriority };
}

export interface IssueWatcher {
  id: string;
  issueId: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface IssueVote {
  id: string;
  issueId: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface IssueVotesResponse {
  count: number;
  hasVoted: boolean;
  voters: IssueVote[];
}

export interface IssueChangelogEntry {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: { id: string; name: string; email: string };
  changedAt: string;
}

export interface IssueLinksResponse {
  linksFrom: IssueLink[];
  linksTo: IssueLink[];
}

// ============================================
// API Client
// ============================================

export const issuesApi = {
  // Core CRUD
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

  // Comments
  addComment: (issueId: string, content: string): Promise<IssueComment> =>
    apiClient.post(`/issues/${issueId}/comments`, { content }),

  getComments: (issueId: string): Promise<IssueComment[]> =>
    apiClient.get(`/issues/${issueId}/comments`),

  // Status update (for board drag-and-drop)
  updateStatus: (id: string, status: IssueStatus, assigneeId?: string): Promise<Issue> =>
    apiClient.put(`/issues/${id}/status`, { status, assigneeId }),

  // ============================================
  // Phase 8: Issue Links
  // ============================================
  
  createLink: (issueId: string, targetIssueId: string, linkType: IssueLinkType): Promise<IssueLink> =>
    apiClient.post(`/issues/${issueId}/links`, { targetIssueId, linkType }),

  getLinks: (issueId: string): Promise<IssueLinksResponse> =>
    apiClient.get(`/issues/${issueId}/links`),

  deleteLink: (issueId: string, linkId: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/issues/${issueId}/links/${linkId}`),

  // ============================================
  // Phase 8: Issue Watchers
  // ============================================

  getWatchers: (issueId: string): Promise<IssueWatcher[]> =>
    apiClient.get(`/issues/${issueId}/watchers`),

  watch: (issueId: string): Promise<{ success: boolean; watching: boolean }> =>
    apiClient.post(`/issues/${issueId}/watch`),

  unwatch: (issueId: string): Promise<{ success: boolean; watching: boolean }> =>
    apiClient.delete(`/issues/${issueId}/watch`),

  isWatching: (issueId: string): Promise<{ watching: boolean }> =>
    apiClient.get(`/issues/${issueId}/watching`),

  // ============================================
  // Phase 8: Issue Votes
  // ============================================

  getVotes: (issueId: string): Promise<IssueVotesResponse> =>
    apiClient.get(`/issues/${issueId}/votes`),

  vote: (issueId: string): Promise<{ success: boolean; voted: boolean; count: number }> =>
    apiClient.post(`/issues/${issueId}/vote`),

  unvote: (issueId: string): Promise<{ success: boolean; voted: boolean; count: number }> =>
    apiClient.delete(`/issues/${issueId}/vote`),

  hasVoted: (issueId: string): Promise<{ voted: boolean }> =>
    apiClient.get(`/issues/${issueId}/voted`),

  // ============================================
  // Phase 8: Issue Changelog
  // ============================================

  getChangelog: (issueId: string, limit?: number): Promise<IssueChangelogEntry[]> =>
    apiClient.get(`/issues/${issueId}/changelog`, { params: { limit } }),
};

