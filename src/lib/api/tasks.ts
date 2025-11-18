/**
 * Tasks API Client
 */

import { apiClient } from '../api-client';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  PaginatedResponse,
} from './types';

export const tasksApi = {
  /**
   * Get all tasks
   */
  async getTasks(query?: TaskQueryDto): Promise<PaginatedResponse<Task>> {
    return apiClient.get('/tasks', { params: query });
  },

  /**
   * Get tasks by project ID
   */
  async getTasksByProject(projectId: string, query?: Omit<TaskQueryDto, 'projectId'>): Promise<PaginatedResponse<Task>> {
    return apiClient.get('/tasks', { params: { ...query, projectId } });
  },

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<Task> {
    return apiClient.get(`/tasks/${id}`);
  },

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDto): Promise<Task> {
    return apiClient.post('/tasks', data);
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    return apiClient.put(`/tasks/${id}`, data);
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    return apiClient.delete(`/tasks/${id}`);
  },

  /**
   * Assign a user to a task
   */
  async assignUser(taskId: string, userId: string): Promise<void> {
    return apiClient.post(`/tasks/${taskId}/assignees`, { userId });
  },

  /**
   * Remove a user from a task
   */
  async unassignUser(taskId: string, userId: string): Promise<void> {
    return apiClient.delete(`/tasks/${taskId}/assignees/${userId}`);
  },

  /**
   * Add a task dependency
   */
  async addDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    return apiClient.post(`/tasks/${taskId}/dependencies`, { taskId: dependsOnTaskId });
  },

  /**
   * Remove a task dependency
   */
  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    return apiClient.delete(`/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
  },
};

