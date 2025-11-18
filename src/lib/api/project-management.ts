/**
 * Project Management API Client (Gantt, resources)
 */

import { apiClient } from '../api-client';

export interface GanttTaskDto {
  id: string;
  name: string;
  start: string | Date;
  end: string | Date;
  progress: number;
  dependencies: string[];
  assignees: string[];
  type: 'task' | 'milestone' | 'project';
  parent?: string;
  critical?: boolean;
}

export interface GanttDataDto {
  tasks: GanttTaskDto[];
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

export const projectManagementApi = {
  async getGanttData(projectId: string): Promise<GanttDataDto> {
    return apiClient.get(`/project-management/gantt/${projectId}`);
  },

  async updateTaskSchedule(projectId: string, taskId: string, startDate: string, endDate: string) {
    return apiClient.put(`/project-management/gantt/${projectId}/tasks/${taskId}/schedule`, {
      startDate,
      endDate,
    });
  },

  async optimizeSchedule(projectId: string) {
    return apiClient.post(`/project-management/gantt/${projectId}/optimize`);
  },
};


