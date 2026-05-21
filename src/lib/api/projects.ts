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
   * Get project members
   */
  async getProjectMembers(projectId: string): Promise<{ members: any[] }> {
    return apiClient.get(`/projects/${projectId}/members`);
  },

  /**
   * Add a member to a project (by userId or email)
   */
  async addMember(projectId: string, userIdOrEmail: string, role: string): Promise<void> {
    const payload: any = { role };
    // Determine if it's an email or userId
    if (userIdOrEmail.includes('@')) {
      payload.email = userIdOrEmail;
    } else {
      payload.userId = userIdOrEmail;
    }
    return apiClient.post(`/projects/${projectId}/members`, payload);
  },

  /**
   * Update a member's role in a project
   */
  async updateMemberRole(projectId: string, userId: string, role: string): Promise<void> {
    return apiClient.put(`/projects/${projectId}/members/${userId}`, { role });
  },

  /**
   * Remove a member from a project
   */
  async removeMember(projectId: string, userId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  /**
   * Archive a project
   */
  async archiveProject(id: string): Promise<Project> {
    return apiClient.post(`/projects/${id}/archive`);
  },

  /**
   * Unarchive a project
   */
  async unarchiveProject(id: string): Promise<Project> {
    return apiClient.post(`/projects/${id}/unarchive`);
  },

  /**
   * Restore a deleted project from bin
   */
  async restoreProject(id: string): Promise<Project> {
    return apiClient.post(`/projects/${id}/restore`);
  },

  /**
   * Permanently delete a project from bin
   */
  async permanentDeleteProject(id: string): Promise<void> {
    return apiClient.delete(`/projects/${id}/permanent`);
  },

  /**
   * Bulk delete projects (soft delete - move to bin)
   */
  async bulkDeleteProjects(ids: string[]): Promise<{ ok: boolean; count: number }> {
    return apiClient.post('/projects/bulk/delete', { ids });
  },

  /**
   * Bulk archive projects
   */
  async bulkArchiveProjects(ids: string[]): Promise<{ ok: boolean; count: number }> {
    return apiClient.post('/projects/bulk/archive', { ids });
  },

  /**
   * Bulk unarchive projects
   */
  async bulkUnarchiveProjects(ids: string[]): Promise<{ ok: boolean; count: number }> {
    return apiClient.post('/projects/bulk/unarchive', { ids });
  },

  /**
   * Get deleted projects (for bin view)
   */
  async getDeletedProjects(): Promise<Project[]> {
    return apiClient.get('/projects/deleted');
  },
};

