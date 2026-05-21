/**
 * Reports API Client
 */

import { apiClient } from '../api-client';

export interface ReportRange {
  projectId?: string;
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  userId?: string;
  includeDetails?: boolean;
}

export const reportsApi = {
  async getBurndown(params: Required<Pick<ReportRange, 'projectId' | 'startDate' | 'endDate'>> & Pick<ReportRange, 'groupBy'>) {
    return apiClient.get('/reports/burndown', { params });
  },

  async getVelocity(params: Pick<ReportRange, 'projectId' | 'startDate' | 'endDate'>) {
    return apiClient.get('/reports/velocity', { params });
  },

  async getCapacity(params: Pick<ReportRange, 'projectId' | 'startDate' | 'endDate'>) {
    return apiClient.get('/reports/capacity', { params });
  },

  async getTimeTracking(params: ReportRange) {
    return apiClient.get('/reports/time-tracking', { params });
  },

  async exportReport(type: 'burndown' | 'velocity' | 'capacity' | 'time-tracking', format: 'csv' | 'json' | 'pdf', params: ReportRange) {
    return apiClient.get(`/reports/export`, {
      params: {
        type,
        format,
        projectId: params.projectId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
      responseType: format === 'csv' ? 'text' : 'json',
    });
  },

  async getProjectSummary(projectId: string) {
    return apiClient.get(`/reports/projects/${projectId}/summary`);
  },

  async generateEmailReport(projectId: string, recipients: string[], reportType: 'summary' | 'full' = 'summary', format: 'html' = 'html') {
    return apiClient.post(`/reports/projects/${projectId}/email`, {
      recipients,
      reportType,
      format,
    });
  },

  async generateComprehensiveReport(projectId: string, options: {
    category?: string;
    type?: string;
    dataSource?: string;
    includeTasks?: boolean;
    includeIssues?: boolean;
    includeApprovals?: boolean;
    includeTeam?: boolean;
    includeBudget?: boolean;
    includeTimeTracking?: boolean;
  }) {
    return apiClient.post(`/reports/projects/${projectId}/generate`, options);
  },
};


