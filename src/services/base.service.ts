/**
 * Base Service Class
 * Provides common functionality for all domain services:
 * - Error handling
 * - Cache invalidation strategy
 * - Optimistic updates
 * - Response transformation
 */

import { QueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { ServiceException, ServiceErrorCode } from './types/errors';
import { OptimisticUpdate, CacheInvalidationStrategy } from './types';

export abstract class BaseService {
  protected abstract readonly basePath: string;
  protected abstract readonly queryClient: QueryClient;

  /**
   * Execute API call with error handling
   */
  protected async execute<T>(
    operation: () => Promise<T>,
    errorMessage = 'Operation failed',
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw ServiceException.fromApiError(error);
    }
  }

  /**
   * GET request with error handling
   */
  protected async get<T>(path: string, config?: { params?: Record<string, unknown> }): Promise<T> {
    return this.execute(
      () => apiClient.get<T>(path, config),
      `Failed to fetch ${this.basePath}`,
    );
  }

  /**
   * POST request with error handling
   */
  protected async post<T>(path: string, data?: unknown): Promise<T> {
    return this.execute(
      () => apiClient.post<T>(path, data),
      `Failed to create ${this.basePath}`,
    );
  }

  /**
   * PUT request with error handling
   */
  protected async put<T>(path: string, data?: unknown): Promise<T> {
    return this.execute(
      () => apiClient.put<T>(path, data),
      `Failed to update ${this.basePath}`,
    );
  }

  /**
   * PATCH request with error handling
   */
  protected async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.execute(
      () => apiClient.patch<T>(path, data),
      `Failed to update ${this.basePath}`,
    );
  }

  /**
   * DELETE request with error handling
   */
  protected async delete<T>(path: string): Promise<T> {
    return this.execute(
      () => apiClient.delete<T>(path),
      `Failed to delete ${this.basePath}`,
    );
  }

  /**
   * Apply cache invalidation strategy
   */
  protected invalidateCache(strategy: CacheInvalidationStrategy): void {
    // Invalidate queries
    if (strategy.invalidateQueries) {
      strategy.invalidateQueries.forEach((queryKey) => {
        this.queryClient.invalidateQueries({ queryKey });
      });
    }

    // Update queries optimistically
    if (strategy.updateQueries) {
      strategy.updateQueries.forEach(({ queryKey, updater }) => {
        this.queryClient.setQueryData(queryKey, updater);
      });
    }
  }

  /**
   * Create optimistic update helper
   */
  protected createOptimisticUpdate<T>(
    queryKey: string[],
    optimisticData: T,
    previousData?: T,
  ): OptimisticUpdate<T> {
    // Get current data
    const currentData = this.queryClient.getQueryData<T>(queryKey) || previousData;

    // Set optimistic data
    this.queryClient.setQueryData(queryKey, optimisticData);

    // Return rollback function
    return {
      data: optimisticData,
      rollback: () => {
        if (currentData !== undefined) {
          this.queryClient.setQueryData(queryKey, currentData);
        } else {
          this.queryClient.removeQueries({ queryKey });
        }
      },
    };
  }

  /**
   * Transform API response to UI model
   * Override in subclasses for domain-specific transformations
   */
  protected transformResponse<T>(response: T): T {
    return response;
  }

  /**
   * Transform UI model to API DTO
   * Override in subclasses for domain-specific transformations
   */
  protected transformRequest<T>(data: T): T {
    return data;
  }
}

