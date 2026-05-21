/**
 * Service Layer Types
 */

export * from './errors';

export interface OptimisticUpdate<T> {
  data: T;
  rollback: () => void;
}

export interface CacheInvalidationStrategy {
  invalidateQueries?: string[][];
  updateQueries?: Array<{
    queryKey: string[];
    updater: (old: unknown) => unknown;
  }>;
}

