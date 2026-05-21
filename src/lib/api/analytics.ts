/**
 * Analytics API Client
 */

import { apiClient } from '../api-client';

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  timeRange?: 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';
}

export const analyticsApi = {
  async getProjectAnalytics(projectId: string, query?: AnalyticsQuery) {
    return apiClient.get(`/analytics/projects/${projectId}`, { params: query });
  },

  async getTaskAnalytics(query?: AnalyticsQuery) {
    return apiClient.get('/analytics/tasks', { params: query });
  },

  async getUserAnalytics(userId: string, query?: AnalyticsQuery) {
    return apiClient.get(`/analytics/users/${userId}`, { params: query });
  },

  async getTenantAnalytics(query?: AnalyticsQuery) {
    return apiClient.get('/analytics/tenant', { params: query });
  },

  async getPerformanceMetrics(projectId?: string, days?: number) {
    return apiClient.get('/analytics/performance', { 
      params: { projectId, days: days || 30 } 
    });
  },

  async getTrendData(metric: 'tasks' | 'projects' | 'completion' | 'velocity', projectId?: string, days?: number, groupBy?: 'day' | 'week' | 'month') {
    return apiClient.get('/analytics/trends', { 
      params: { metric, projectId, days: days || 30, groupBy: groupBy || 'day' } 
    });
  },

  async getWorkloadAnalysis(projectId?: string) {
    return apiClient.get('/analytics/workload', { params: { projectId } });
  },

  async getForecast(projectId: string, targetDate: string) {
    return apiClient.get('/analytics/forecast', { params: { projectId, targetDate } });
  },
};

