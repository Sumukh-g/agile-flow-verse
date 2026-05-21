/**
 * Issues Management Hooks
 * 
 * Enterprise-grade React Query hooks for issue management operations.
 * Implements Phase 8: Advanced Issue Features with optimal performance.
 * 
 * Features:
 * - Custom issue types
 * - Custom workflows
 * - Issue linking (blocks, duplicates, relates to)
 * - Issue history/changelog
 * - Watcher/follower system
 * - Voting on issues
 * - SLA tracking
 * - Issue templates
 * - Bulk operations
 * 
 * @module hooks/useIssues
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { issuesApi, type IssueStatus } from '@/lib/api/issues';
import { STALE_TIMES } from '@/lib/query-optimization';

// ============================================
// TYPES
// ============================================

/**
 * Issue type definition
 */
export interface IssueType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  workflowId?: string;
  isDefault: boolean;
  tenantId: string;
}

/**
 * Issue workflow definition
 */
export interface IssueWorkflow {
  id: string;
  name: string;
  description?: string;
  transitions: WorkflowTransition[];
  validators?: WorkflowValidator[];
  version: number;
  isActive: boolean;
  tenantId: string;
}

/**
 * Workflow transition rule
 */
export interface WorkflowTransition {
  from: string;
  to: string;
  name: string;
  conditions?: TransitionCondition[];
  requiredFields?: string[];
}

/**
 * Transition condition
 */
export interface TransitionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

/**
 * Workflow validator
 */
export interface WorkflowValidator {
  type: 'required_field' | 'custom_rule' | 'permission_check';
  config: Record<string, any>;
}

/**
 * Issue link type
 */
export type IssueLinkType = 'blocks' | 'is_blocked_by' | 'duplicates' | 'is_duplicated_by' | 'relates_to';

/**
 * Issue link
 */
export interface IssueLink {
  id: string;
  sourceIssueId: string;
  targetIssueId: string;
  linkType: IssueLinkType;
  createdAt: string;
}

/**
 * Issue changelog entry
 */
export interface IssueChangelog {
  id: string;
  issueId: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: {
    id: string;
    name: string;
    email: string;
  };
  changedAt: string;
  comment?: string;
}

/**
 * Issue watcher
 */
export interface IssueWatcher {
  id: string;
  issueId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

/**
 * Issue vote
 */
export interface IssueVote {
  id: string;
  issueId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

/**
 * SLA tracking data
 */
export interface IssueSLA {
  issueId: string;
  responseTime?: {
    target: number; // milliseconds
    actual?: number;
    status: 'on_time' | 'at_risk' | 'breached';
  };
  resolutionTime?: {
    target: number; // milliseconds
    actual?: number;
    status: 'on_time' | 'at_risk' | 'breached';
  };
  firstResponseAt?: string;
  resolvedAt?: string;
}

/**
 * Issue template
 */
export interface IssueTemplate {
  id: string;
  name: string;
  description?: string;
  issueTypeId: string;
  projectId?: string;
  fields: Record<string, any>;
  tenantId: string;
}

/**
 * Complete issue with all relations
 */
export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  issueTypeId: string;
  issueType?: IssueType;
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  
  // Advanced features
  links?: IssueLink[];
  changelog?: IssueChangelog[];
  watchers?: IssueWatcher[];
  votes?: IssueVote[];
  sla?: IssueSLA;
  storyPoints?: number;
  epicId?: string;
  sprintId?: string;
}

// ============================================
// CACHE KEYS
// ============================================

export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) =>
    [...issueKeys.lists(), { filters }] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
  types: () => [...issueKeys.all, 'types'] as const,
  workflows: () => [...issueKeys.all, 'workflows'] as const,
  templates: () => [...issueKeys.all, 'templates'] as const,
  changelog: (issueId: string) => [...issueKeys.detail(issueId), 'changelog'] as const,
  watchers: (issueId: string) => [...issueKeys.detail(issueId), 'watchers'] as const,
  votes: (issueId: string) => [...issueKeys.detail(issueId), 'votes'] as const,
  links: (issueId: string) => [...issueKeys.detail(issueId), 'links'] as const,
  sla: (issueId: string) => [...issueKeys.detail(issueId), 'sla'] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Get all issues with optional filters
 */
export function useIssues(filters?: Record<string, any>) {
  return useQuery({
    queryKey: issueKeys.list(filters || {}),
    queryFn: async () => {
      const response = await api.issues.list(filters);
      return response;
    },
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Get a single issue by ID
 */
export function useIssue(issueId: string) {
  return useQuery({
    queryKey: issueKeys.detail(issueId),
    queryFn: async () => {
      const response = await api.issues.get(issueId);
      return response;
    },
    staleTime: STALE_TIMES.FREQUENT,
    enabled: !!issueId,
  });
}

/**
 * Get issue changelog (audit trail of all changes)
 */
export function useIssueChangelog(issueId: string, limit?: number) {
  return useQuery({
    queryKey: [...issueKeys.changelog(issueId), limit],
    queryFn: async () => {
      const response = await issuesApi.getChangelog(issueId, limit);
      return response;
    },
    staleTime: STALE_TIMES.MODERATE,
    enabled: !!issueId,
  });
}

/**
 * Get issue watchers
 */
export function useIssueWatchers(issueId: string) {
  return useQuery({
    queryKey: issueKeys.watchers(issueId),
    queryFn: async () => {
      const response = await api.issues.getWatchers(issueId);
      return response;
    },
    staleTime: STALE_TIMES.MODERATE,
    enabled: !!issueId,
  });
}

/**
 * Get issue votes
 */
export function useIssueVotes(issueId: string) {
  return useQuery({
    queryKey: issueKeys.votes(issueId),
    queryFn: async () => {
      const response = await api.issues.getVotes(issueId);
      return response;
    },
    staleTime: STALE_TIMES.MODERATE,
    enabled: !!issueId,
  });
}

/**
 * Get issue links
 */
export function useIssueLinks(issueId: string) {
  return useQuery({
    queryKey: issueKeys.links(issueId),
    queryFn: async () => {
      const response = await api.issues.getLinks(issueId);
      return response;
    },
    staleTime: STALE_TIMES.MODERATE,
    enabled: !!issueId,
  });
}

/**
 * Get issue SLA
 */
export function useIssueSLA(issueId: string) {
  return useQuery({
    queryKey: issueKeys.sla(issueId),
    queryFn: async () => {
      const response = await api.issues.getSLA(issueId);
      return response;
    },
    staleTime: STALE_TIMES.FREQUENT,
    enabled: !!issueId,
  });
}

/**
 * Get all issue types
 */
export function useIssueTypes() {
  return useQuery({
    queryKey: issueKeys.types(),
    queryFn: async () => {
      const response = await api.issues.getTypes();
      return response;
    },
    staleTime: STALE_TIMES.STABLE,
  });
}

/**
 * Get all workflows
 */
export function useIssueWorkflows() {
  return useQuery({
    queryKey: issueKeys.workflows(),
    queryFn: async () => {
      const response = await api.issues.getWorkflows();
      return response;
    },
    staleTime: STALE_TIMES.STABLE,
  });
}

/**
 * Get issue templates
 */
export function useIssueTemplates(projectId?: string) {
  return useQuery({
    queryKey: [...issueKeys.templates(), projectId],
    queryFn: async () => {
      const response = await api.issues.getTemplates(projectId);
      return response;
    },
    staleTime: STALE_TIMES.STABLE,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new issue
 */
export function useCreateIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Issue>) => {
      return api.issues.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

/**
 * Update an issue
 */
export function useUpdateIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Issue>) => {
      return api.issues.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

/**
 * Delete an issue
 */
export function useDeleteIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issueId: string) => {
      return api.issues.delete(issueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

/**
 * Update issue status (commonly used in triage/dev boards)
 */
export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      issueId, 
      status, 
      assigneeId 
    }: { 
      issueId: string; 
      status: IssueStatus; 
      assigneeId?: string;
    }) => {
      return issuesApi.updateStatus(issueId, status, assigneeId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

/**
 * Get issue comments
 */
export function useIssueComments(issueId: string) {
  return useQuery({
    queryKey: [...issueKeys.detail(issueId), 'comments'],
    queryFn: async () => {
      return issuesApi.getComments(issueId);
    },
    staleTime: STALE_TIMES.FREQUENT,
    enabled: !!issueId,
  });
}

/**
 * Add comment to issue
 */
export function useAddIssueComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      issueId, 
      content 
    }: { 
      issueId: string; 
      content: string;
    }) => {
      return issuesApi.addComment(issueId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...issueKeys.detail(variables.issueId), 'comments'] });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
    },
  });
}

/**
 * Clone an issue
 */
export function useCloneIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      issueId, 
      options 
    }: { 
      issueId: string; 
      options?: { 
        cloneSubtasks?: boolean; 
        cloneLinks?: boolean; 
        cloneAttachments?: boolean;
      } 
    }) => {
      return api.issues.clone(issueId, options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

/**
 * Link two issues
 */
export function useLinkIssues() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      sourceIssueId,
      targetIssueId,
      linkType,
    }: {
      sourceIssueId: string;
      targetIssueId: string;
      linkType: IssueLinkType;
    }) => {
      return api.issues.createLink(sourceIssueId, targetIssueId, linkType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.links(variables.sourceIssueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.links(variables.targetIssueId) });
    },
  });
}

/**
 * Unlink issues (delete an issue link)
 */
export function useUnlinkIssues() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ issueId, linkId }: { issueId: string; linkId: string }) => {
      return api.issues.deleteLink(issueId, linkId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.links(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

/**
 * Watch an issue
 */
export function useWatchIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issueId: string) => {
      return api.issues.watch(issueId);
    },
    onSuccess: (_, issueId) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.watchers(issueId) });
    },
  });
}

/**
 * Unwatch an issue
 */
export function useUnwatchIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issueId: string) => {
      return api.issues.unwatch(issueId);
    },
    onSuccess: (_, issueId) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.watchers(issueId) });
    },
  });
}

/**
 * Vote on an issue
 */
export function useVoteIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issueId: string) => {
      return api.issues.vote(issueId);
    },
    onSuccess: (_, issueId) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.votes(issueId) });
    },
  });
}

/**
 * Remove vote from issue
 */
export function useUnvoteIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issueId: string) => {
      return api.issues.unvote(issueId);
    },
    onSuccess: (_, issueId) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.votes(issueId) });
    },
  });
}

/**
 * Bulk update issues
 */
export function useBulkUpdateIssues() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      issueIds,
      updates,
    }: {
      issueIds: string[];
      updates: Partial<Issue>;
    }) => {
      return api.issues.bulkUpdate(issueIds, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

/**
 * Bulk delete issues
 */
export function useBulkDeleteIssues() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issueIds: string[]) => {
      return api.issues.bulkDelete(issueIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

/**
 * Create issue type
 */
export function useCreateIssueType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<IssueType, 'id' | 'tenantId'>) => {
      return api.issues.createType(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.types() });
    },
  });
}

/**
 * Create workflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<IssueWorkflow, 'id' | 'tenantId' | 'version'>) => {
      return api.issues.createWorkflow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.workflows() });
    },
  });
}

/**
 * Create issue template
 */
export function useCreateIssueTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<IssueTemplate, 'id' | 'tenantId'>) => {
      return api.issues.createTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.templates() });
    },
  });
}
