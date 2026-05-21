/**
 * Tasks Service
 * Handles all task-related operations with proper error handling,
 * cache management, and optimistic updates
 */

import { QueryClient } from '@tanstack/react-query';
import { BaseService } from './base.service';
import { CacheInvalidationStrategy, OptimisticUpdate } from './types';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  PaginatedResponse,
} from '@/shared/types';
import { Task } from '@prisma/client';

// Extended Task type with relations
export type TaskWithRelations = Task & {
  assignees?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  project?: {
    id: string;
    name: string;
  } | null;
};

// Query keys factory for tasks
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (query?: TaskQueryDto) => [...taskKeys.lists(), query] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  project: (projectId: string) => [...taskKeys.all, 'project', projectId] as const,
  personal: () => [...taskKeys.all, 'personal'] as const,
};

export class TasksService extends BaseService {
  protected readonly basePath = '/tasks';

  constructor(protected readonly queryClient: QueryClient) {
    super();
  }

  /**
   * Get tasks with query filters
   */
  async getTasks(query?: TaskQueryDto): Promise<TaskWithRelations[]> {
    const response = await this.get<PaginatedResponse<TaskWithRelations>>(this.basePath, {
      params: query,
    });
    return this.transformResponse(response.items);
  }

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<TaskWithRelations> {
    return this.get<TaskWithRelations>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new task with optimistic update
   */
  async createTask(data: CreateTaskDto): Promise<TaskWithRelations> {
    const transformedData = this.transformRequest(data);

    // Optimistic update
    const optimisticTask: TaskWithRelations = {
      id: `temp-${Date.now()}`,
      title: data.title,
      description: data.description || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      projectId: data.projectId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedHours: data.estimatedHours || null,
      actualHours: data.actualHours || 0,
      tenantId: '', // Will be set by backend
      createdAt: new Date(),
      updatedAt: new Date(),
      assignees: [],
      project: null,
    };

    // Apply optimistic update
    const queryKey = data.projectId
      ? taskKeys.project(data.projectId)
      : taskKeys.personal();
    const optimisticUpdate = this.createOptimisticUpdate(
      queryKey,
      (prev: TaskWithRelations[] = []) => [...prev, optimisticTask],
    );

    try {
      // Make API call
      const task = await this.post<TaskWithRelations>(this.basePath, transformedData);

      // Invalidate and refetch
      this.invalidateCache({
        invalidateQueries: [
          taskKeys.all,
          taskKeys.lists(),
          data.projectId ? taskKeys.project(data.projectId) : taskKeys.personal(),
        ],
      });

      return task;
    } catch (error) {
      // Rollback optimistic update
      optimisticUpdate.rollback();
      throw error;
    }
  }

  /**
   * Update a task with optimistic update
   */
  async updateTask(id: string, data: UpdateTaskDto): Promise<TaskWithRelations> {
    const transformedData = this.transformRequest(data);

    // Get current task for optimistic update
    const currentTask = this.queryClient.getQueryData<TaskWithRelations>(taskKeys.detail(id));
    const previousTasks = this.queryClient.getQueryData<TaskWithRelations[]>(taskKeys.lists());

    // Optimistic update
    const optimisticTask: TaskWithRelations = currentTask
      ? { ...currentTask, ...transformedData, updatedAt: new Date() }
      : ({
          id,
          ...transformedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as TaskWithRelations);

    // Apply optimistic update to detail query
    const detailUpdate = this.createOptimisticUpdate(
      taskKeys.detail(id),
      optimisticTask,
      currentTask,
    );

    // Apply optimistic update to list queries
    if (previousTasks) {
      const listUpdate = this.createOptimisticUpdate(
        taskKeys.lists(),
        previousTasks.map((t) => (t.id === id ? optimisticTask : t)),
        previousTasks,
      );
    }

    try {
      // Make API call
      const task = await this.put<TaskWithRelations>(`${this.basePath}/${id}`, transformedData);

      // Invalidate and refetch
      this.invalidateCache({
        invalidateQueries: [
          taskKeys.all,
          taskKeys.lists(),
          taskKeys.detail(id),
          taskKeys.details(),
        ],
      });

      return task;
    } catch (error) {
      // Rollback optimistic updates
      detailUpdate.rollback();
      throw error;
    }
  }

  /**
   * Delete a task with optimistic update
   */
  async deleteTask(id: string): Promise<void> {
    // Get current data for rollback
    const currentTask = this.queryClient.getQueryData<TaskWithRelations>(taskKeys.detail(id));
    const previousTasks = this.queryClient.getQueryData<TaskWithRelations[]>(taskKeys.lists());

    // Optimistic update - remove from cache
    this.queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
    if (previousTasks) {
      const listUpdate = this.createOptimisticUpdate(
        taskKeys.lists(),
        previousTasks.filter((t) => t.id !== id),
        previousTasks,
      );

      try {
        // Make API call
        await this.delete(`${this.basePath}/${id}`);

        // Invalidate queries
        this.invalidateCache({
          invalidateQueries: [
            taskKeys.all,
            taskKeys.lists(),
            taskKeys.details(),
          ],
        });
      } catch (error) {
        // Rollback optimistic update
        listUpdate.rollback();
        if (currentTask) {
          this.queryClient.setQueryData(taskKeys.detail(id), currentTask);
        }
        throw error;
      }
    } else {
      // No list data, just make the call
      await this.delete(`${this.basePath}/${id}`);
      this.invalidateCache({
        invalidateQueries: [taskKeys.all, taskKeys.lists(), taskKeys.details()],
      });
    }
  }

  /**
   * Get cache invalidation strategy for task mutations
   */
  getInvalidationStrategy(projectId?: string | null): CacheInvalidationStrategy {
    const invalidateQueries: string[][] = [taskKeys.all, taskKeys.lists()];

    if (projectId) {
      invalidateQueries.push(taskKeys.project(projectId));
    } else {
      invalidateQueries.push(taskKeys.personal());
    }

    return { invalidateQueries };
  }
}

