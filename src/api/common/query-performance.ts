/**
 * Query Performance Logging
 * Logs slow queries in development to help identify performance issues
 */

import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const logger = new Logger('QueryPerformance');
const SLOW_QUERY_THRESHOLD_MS = 100; // Log queries slower than 100ms

/**
 * Wrap a Prisma query to log performance
 */
export async function logQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return queryFn();
  }

  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      logger.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    } else {
      logger.debug(`Query: ${queryName} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Query failed: ${queryName} took ${duration}ms`, error);
    throw error;
  }
}

/**
 * Log Prisma query event
 */
export function logPrismaQuery(event: Prisma.QueryEvent): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const duration = event.duration;
  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    logger.warn(
      `Slow Prisma query: ${event.query} | Duration: ${duration}ms | Params: ${event.params}`,
    );
  }
}

