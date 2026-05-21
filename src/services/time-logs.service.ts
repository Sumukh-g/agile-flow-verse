/**
 * Time Logs Service
 * 
 * Handles all time log-related operations with proper error handling,
 * cache management, and API communication.
 * 
 * Features:
 * - CRUD operations for time logs
 * - Start/stop timer functionality
 * - Active timer tracking
 * - Automatic duration calculation
 * - Task hours synchronization
 * 
 * Extends BaseService for consistent error handling and caching strategies.
 */

import { QueryClient } from '@tanstack/react-query';
import { BaseService } from './base.service';
import {
  CreateTimeLogDto,
  UpdateTimeLogDto,
  TimeLogQueryDto,
  PaginatedResponse,
} from '@/shared/types';
import { TimeLog } from '@prisma/client';

// Extended TimeLog type with relations
export type TimeLogWithRelations = TimeLog & {
  task?: {
    id: string;
    title: string;
    projectId?: string | null;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

// Query keys factory for time logs
export const timeLogKeys = {
  all: ['timeLogs'] as const,
  lists: () => [...timeLogKeys.all, 'list'] as const,
  list: (query?: TimeLogQueryDto) => [...timeLogKeys.lists(), query] as const,
  details: () => [...timeLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeLogKeys.details(), id] as const,
  task: (taskId: string) => [...timeLogKeys.all, 'task', taskId] as const,
  active: () => [...timeLogKeys.all, 'active'] as const,
};

export class TimeLogsService extends BaseService {
  protected readonly basePath = '/v1/time-logs';
  protected readonly queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    super();
    this.queryClient = queryClient;
  }

  /**
   * Create a time log entry
   */
  async create(dto: CreateTimeLogDto): Promise<TimeLogWithRelations> {
    return this.post<TimeLogWithRelations>(this.basePath, dto);
  }

  /**
   * Start a timer for a task
   */
  async startTimer(taskId: string, description?: string): Promise<TimeLogWithRelations> {
    return this.post<TimeLogWithRelations>(`${this.basePath}/start`, {
      taskId,
      description,
    });
  }

  /**
   * Stop the active timer
   */
  async stopTimer(description?: string): Promise<TimeLogWithRelations> {
    return this.post<TimeLogWithRelations>(`${this.basePath}/stop`, {
      description,
    });
  }

  /**
   * Get the active timer
   */
  async getActiveTimer(): Promise<(TimeLogWithRelations & { currentDuration: number }) | null> {
    return this.get<TimeLogWithRelations & { currentDuration: number } | null>(
      `${this.basePath}/active`,
    );
  }

  /**
   * List time logs with pagination
   */
  async list(query: TimeLogQueryDto): Promise<PaginatedResponse<TimeLogWithRelations>> {
    return this.get<PaginatedResponse<TimeLogWithRelations>>(this.basePath, { params: query });
  }

  /**
   * Update a time log entry
   */
  async update(id: string, dto: UpdateTimeLogDto): Promise<TimeLogWithRelations> {
    return this.put<TimeLogWithRelations>(`${this.basePath}/${id}`, dto);
  }

  /**
   * Delete a time log entry
   */
  async remove(id: string): Promise<{ ok: boolean }> {
    return this.delete<{ ok: boolean }>(`${this.basePath}/${id}`);
  }

  /**
   * Get cache invalidation strategy
   */
  protected getCacheInvalidationStrategy(): Record<string, string[]> {
    return {
      create: [timeLogKeys.lists(), timeLogKeys.active()],
      update: [timeLogKeys.lists(), timeLogKeys.details(), timeLogKeys.active()],
      delete: [timeLogKeys.lists(), timeLogKeys.details()],
      startTimer: [timeLogKeys.active(), timeLogKeys.lists()],
      stopTimer: [timeLogKeys.active(), timeLogKeys.lists()],
    };
  }
}

