/**
 * Gantt API Client
 * Handles all Gantt chart API calls
 */

import { apiClient } from '../api-client';

export interface GanttTask {
  id: string;
  name: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  progress: number;
  type: 'task' | 'milestone' | 'project';
  priority: string;
  status: string;
  assignees: string[];
  parentId?: string;
  critical: boolean;
  duration?: number;
  notes?: string;
  groupId?: string;
  dependencies?: string[];
}

export interface GanttDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: string;
  lag: number;
}

export interface GanttData {
  tasks: GanttTask[];
  criticalPath: string[];
  timeline: {
    start: string | Date;
    end: string | Date;
    milestones: Array<{
      id: string;
      name: string;
      date: string | Date;
      completed: boolean;
    }>;
  };
}

export const ganttApi = {
  async getGanttData(projectId: string): Promise<GanttData> {
    return apiClient.get(`/gantt/projects/${projectId}`);
  },

  async createTask(projectId: string, data: Partial<GanttTask>): Promise<GanttTask> {
    return apiClient.post(`/gantt/projects/${projectId}/tasks`, data);
  },

  async updateTask(projectId: string, taskId: string, data: Partial<GanttTask>): Promise<GanttTask> {
    return apiClient.put(`/gantt/projects/${projectId}/tasks/${taskId}`, data);
  },

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    return apiClient.delete(`/gantt/projects/${projectId}/tasks/${taskId}`);
  },

  async updateTaskSchedule(projectId: string, taskId: string, startDate: string, endDate: string): Promise<void> {
    return apiClient.put(`/gantt/projects/${projectId}/tasks/${taskId}/schedule`, {
      startDate,
      endDate,
    });
  },

  async createDependency(
    projectId: string,
    fromTaskId: string,
    toTaskId: string,
    type?: string,
    lag?: number,
  ): Promise<GanttDependency> {
    return apiClient.post(`/gantt/projects/${projectId}/dependencies`, {
      fromTaskId,
      toTaskId,
      type,
      lag,
    });
  },

  async deleteDependency(projectId: string, dependencyId: string): Promise<void> {
    return apiClient.delete(`/gantt/projects/${projectId}/dependencies/${dependencyId}`);
  },
};

