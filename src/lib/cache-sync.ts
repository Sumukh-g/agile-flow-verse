import { QueryClient } from '@tanstack/react-query';

/**
 * Advanced cache synchronization utilities
 * Provides optimistic updates, conflict resolution, and smart invalidation
 */

export interface CacheUpdate {
  queryKey: string[];
  updater: (old: any) => any;
  optimistic?: boolean;
}

export class CacheSync {
  constructor(private queryClient: QueryClient) {}

  /**
   * Optimistically update cache with rollback on error
   */
  async optimisticUpdate<T>(
    queryKey: string[],
    updater: (old: T | undefined) => T,
    mutationFn: () => Promise<T>,
    onError?: (error: any) => void,
  ): Promise<T> {
    // Cancel outgoing queries
    await this.queryClient.cancelQueries({ queryKey });

    // Snapshot previous value
    const previous = this.queryClient.getQueryData<T>(queryKey);

    // Optimistically update
    this.queryClient.setQueryData<T>(queryKey, updater);

    try {
      // Perform mutation
      const result = await mutationFn();
      
      // Update with server response
      this.queryClient.setQueryData<T>(queryKey, result);
      
      return result;
    } catch (error) {
      // Rollback on error
      if (previous !== undefined) {
        this.queryClient.setQueryData<T>(queryKey, previous);
      } else {
        this.queryClient.invalidateQueries({ queryKey });
      }
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Batch update multiple cache entries
   */
  batchUpdate(updates: CacheUpdate[]) {
    updates.forEach(({ queryKey, updater, optimistic = false }) => {
      if (optimistic) {
        const previous = this.queryClient.getQueryData(queryKey);
        this.queryClient.setQueryData(queryKey, updater);
        return () => {
          if (previous !== undefined) {
            this.queryClient.setQueryData(queryKey, previous);
          }
        };
      } else {
        this.queryClient.setQueryData(queryKey, updater);
      }
    });
  }

  /**
   * Smart invalidation - only invalidate if data exists
   */
  smartInvalidate(queryKey: string[]) {
    const data = this.queryClient.getQueryData(queryKey);
    if (data !== undefined) {
      this.queryClient.invalidateQueries({ queryKey });
    }
  }

  /**
   * Update related queries when an entity changes
   */
  updateRelated(entityType: 'task' | 'project' | 'note', entityId: string, data: any) {
    // Update specific entity
    this.queryClient.setQueryData([entityType, entityId], data);

    // Update list queries
    this.queryClient.setQueriesData(
      { queryKey: [entityType + 's'], exact: false },
      (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((item: any) => (item.id === entityId ? { ...item, ...data } : item));
      },
    );

    // Update project-specific lists
    if (entityType === 'task' && data.projectId) {
      this.queryClient.setQueriesData(
        { queryKey: ['tasks', data.projectId], exact: false },
        (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((item: any) => (item.id === entityId ? { ...item, ...data } : item));
        },
      );
    }
  }

  /**
   * Remove entity from all related queries
   */
  removeEntity(entityType: 'task' | 'project' | 'note', entityId: string) {
    // Remove from specific query
    this.queryClient.removeQueries({ queryKey: [entityType, entityId] });

    // Remove from list queries
    this.queryClient.setQueriesData(
      { queryKey: [entityType + 's'], exact: false },
      (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((item: any) => item.id !== entityId);
      },
    );
  }

  /**
   * Conflict resolution using version-based merging
   */
  resolveConflict<T extends { id: string; version?: number; updatedAt?: string }>(
    local: T,
    remote: T,
    strategy: 'last-write-wins' | 'merge' | 'manual' = 'last-write-wins',
  ): T {
    if (strategy === 'last-write-wins') {
      const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
      const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
      return remoteTime > localTime ? remote : local;
    }

    if (strategy === 'merge') {
      return { ...local, ...remote, id: local.id };
    }

    return remote; // manual resolution requires user intervention
  }
}

