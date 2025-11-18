/**
 * Projects API Client
 */

import { apiClient } from '../api-client';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  PaginatedResponse,
} from './types';

export const projectsApi = {
  /**
   * Get all projects
   */
  async getProjects(query?: ProjectQueryDto): Promise<PaginatedResponse<Project>> {
    return apiClient.get('/projects', { params: query });
  },

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project> {
    return apiClient.get(`/projects/${id}`);
  },

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    return apiClient.post('/projects', data);
  },

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    return apiClient.put(`/projects/${id}`, data);
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    return apiClient.delete(`/projects/${id}`);
  },

  /**
   * Get project statistics
   */
  async getProjectStats(id: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    overdueTask: number;
    completionPercentage: number;
    teamSize: number;
  }> {
    return apiClient.get(`/projects/${id}/stats`);
  },

  /**
   * Add a member to a project
   */
  async addMember(projectId: string, userId: string, role: string): Promise<void> {
    return apiClient.post(`/projects/${projectId}/members`, { userId, role });
  },

  /**
   * Remove a member from a project
   */
  async removeMember(projectId: string, userId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
};

