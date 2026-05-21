/**
 * Standard API Response Wrappers
 * Provides consistent response structure across all API endpoints
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  traceId?: string;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    traceId: string;
  };
}

/**
 * Success response helper
 */
export function createApiResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
  traceId?: string,
): ApiResponse<T> {
  return {
    data,
    meta,
    traceId,
  };
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse<T>(
  items: T[],
  nextCursor: string | null,
  total?: number,
): PaginatedResponse<T> {
  return {
    items,
    nextCursor,
    hasMore: nextCursor !== null,
    total,
  };
}

/**
 * Error response helper
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  traceId?: string,
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      traceId: traceId || 'unknown',
    },
  };
}

