/**
 * Dashboard API Client
 */

import { apiClient } from '../api-client';
import { DashboardStats } from './types';

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    return apiClient.get('/dashboard');
  },

  /**
   * Get project-specific dashboard data
   */
  async getProjectDashboard(projectId: string): Promise<any> {
    return apiClient.get(`/dashboard/project/${projectId}`);
  },
};

