/**
 * Cache Service
 * Provides caching functionality with automatic TTL and invalidation
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisClient, getRedis } from '../redis/redis.client';
import { CacheKeys, CacheTTL } from './cache-keys';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: RedisClient;

  constructor() {
    this.redis = getRedis();
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Cache get failed for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.warn(`Cache set failed for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Cache delete failed for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      return await this.redis.delPattern(pattern);
    } catch (error) {
      this.logger.warn(`Cache deletePattern failed for pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0;
    }
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalidate dashboard cache
   */
  async invalidateDashboard(tenantId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.delete(CacheKeys.dashboard(tenantId, userId));
    } else {
      await this.deletePattern(CacheKeys.dashboardPattern(tenantId));
    }
  }

  /**
   * Invalidate user permissions cache
   */
  async invalidateUserPermissions(tenantId: string, userId: string): Promise<void> {
    await this.delete(CacheKeys.userPermissions(tenantId, userId));
    await this.deletePattern(CacheKeys.userPermissionsPattern(tenantId, userId));
  }

  /**
   * Invalidate project membership cache
   */
  async invalidateProjectMembership(tenantId: string, userId?: string, projectId?: string): Promise<void> {
    if (userId) {
      await this.delete(CacheKeys.projectMembership(tenantId, userId));
      await this.deletePattern(CacheKeys.projectMembershipPattern(tenantId, userId));
    }
    if (projectId) {
      await this.delete(CacheKeys.projectMembers(tenantId, projectId));
    }
  }

  /**
   * Invalidate tasks cache
   */
  async invalidateTasks(tenantId: string, projectId?: string): Promise<void> {
    if (projectId) {
      await this.delete(CacheKeys.tasks(tenantId, projectId));
    }
    // Also invalidate "all tasks" cache
    await this.delete(CacheKeys.tasks(tenantId));
    // Invalidate pattern to catch any related caches
    await this.deletePattern(CacheKeys.tasksPattern(tenantId));
  }

  /**
   * Invalidate projects cache
   */
  async invalidateProjects(tenantId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.delete(CacheKeys.projects(tenantId, userId));
    }
    await this.deletePattern(CacheKeys.projectsPattern(tenantId));
  }

  /**
   * Invalidate issues cache
   */
  async invalidateIssues(tenantId: string, projectId?: string): Promise<void> {
    if (projectId) {
      await this.delete(CacheKeys.issues(tenantId, projectId));
    }
    await this.delete(CacheKeys.issues(tenantId));
    await this.deletePattern(CacheKeys.issuesPattern(tenantId));
  }

  /**
   * Invalidate analytics cache
   */
  async invalidateAnalytics(tenantId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.delete(CacheKeys.analytics(tenantId, userId));
    }
    await this.deletePattern(CacheKeys.analyticsPattern(tenantId));
  }
}

