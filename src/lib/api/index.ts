/**
 * Centralized API Client
 * Export all API modules
 */

export * from './types';
export * from './auth';
export * from './projects';
export * from './tasks';
export * from './notes';
export * from './notifications';
export * from './automation';
export * from './agents';
export * from './calendar';
export * from './dashboard';
export * from './forms';
export * from './issues';
export * from './kanban';
export * from './gantt';
export * from './analytics';

// Re-export for convenience
import { authApi } from './auth';
import { projectsApi } from './projects';
import { tasksApi } from './tasks';
import { notesApi } from './notes';
import { notificationsApi } from './notifications';
import { automationApi } from './automation';
import { agentsApi } from './agents';
import { calendarApi } from './calendar';
import { dashboardApi } from './dashboard';
import { crmApi } from './crm';
import { formsApi } from './forms';
import { storageApi } from './storage';
import { issuesApi } from './issues';
import { reportsApi } from './reports';
import { analyticsApi } from './analytics';
import { projectManagementApi } from './project-management';
import { kanbanApi } from './kanban';
import { ganttApi } from './gantt';

export const api = {
  auth: authApi,
  projects: projectsApi,
  tasks: tasksApi,
  notes: notesApi,
  notifications: notificationsApi,
  automation: automationApi,
  agents: agentsApi,
  calendar: calendarApi,
  dashboard: dashboardApi,
  crm: crmApi,
  forms: formsApi,
  storage: storageApi,
  issues: issuesApi,
  reports: reportsApi,
  analytics: analyticsApi,
  projectManagement: projectManagementApi,
  kanban: kanbanApi,
  gantt: ganttApi,
};

