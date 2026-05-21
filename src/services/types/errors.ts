/**
 * Service Error Types
 * Centralized error handling for service layer
 */

export enum ServiceErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  details?: unknown;
  traceId?: string;
  originalError?: unknown;
}

export class ServiceException extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
    public readonly details?: unknown,
    public readonly traceId?: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'ServiceException';
  }

  static fromApiError(error: unknown): ServiceException {
    // Handle Axios errors
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          status: number;
          data?: {
            error?: {
              code: string;
              message: string;
              traceId?: string;
              details?: unknown;
            };
          };
        };
      };

      const status = axiosError.response?.status;
      const errorData = axiosError.response?.data?.error;

      if (status === 401) {
        return new ServiceException(
          ServiceErrorCode.UNAUTHORIZED,
          errorData?.message || 'Unauthorized',
          errorData?.details,
          errorData?.traceId,
          error,
        );
      }

      if (status === 403) {
        return new ServiceException(
          ServiceErrorCode.FORBIDDEN,
          errorData?.message || 'Forbidden',
          errorData?.details,
          errorData?.traceId,
          error,
        );
      }

      if (status === 404) {
        return new ServiceException(
          ServiceErrorCode.NOT_FOUND,
          errorData?.message || 'Not found',
          errorData?.details,
          errorData?.traceId,
          error,
        );
      }

      if (status === 400) {
        return new ServiceException(
          ServiceErrorCode.VALIDATION_ERROR,
          errorData?.message || 'Validation error',
          errorData?.details,
          errorData?.traceId,
          error,
        );
      }

      if (status >= 500) {
        return new ServiceException(
          ServiceErrorCode.SERVER_ERROR,
          errorData?.message || 'Server error',
          errorData?.details,
          errorData?.traceId,
          error,
        );
      }
    }

    // Handle network errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as { message: string }).message;
      if (errorMessage.includes('Network') || errorMessage.includes('offline')) {
        return new ServiceException(
          ServiceErrorCode.NETWORK_ERROR,
          'Network error. Please check your connection.',
          undefined,
          undefined,
          error,
        );
      }

      if (errorMessage.includes('Offline') || errorMessage.includes('queued')) {
        return new ServiceException(
          ServiceErrorCode.OFFLINE,
          'You are offline. Changes will be synced when you reconnect.',
          undefined,
          undefined,
          error,
        );
      }
    }

    // Unknown error
    return new ServiceException(
      ServiceErrorCode.UNKNOWN,
      error instanceof Error ? error.message : 'An unknown error occurred',
      undefined,
      undefined,
      error,
    );
  }
}

