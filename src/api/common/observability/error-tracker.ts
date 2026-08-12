import { Logger } from '@nestjs/common';

export interface TrackedErrorContext {
  status?: number;
  code?: string;
  method?: string;
  url?: string;
  userId?: string;
  tenantId?: string;
  traceId?: string;
}

export interface TrackedError extends TrackedErrorContext {
  timestamp: string;
  name: string;
  message: string;
}

/**
 * ErrorTracker
 *
 * Lightweight, dependency-optional error tracking:
 * - Always keeps a bounded in-memory buffer of recent server errors plus
 *   per-type counts, which power the monitoring error-metrics endpoint.
 * - Additionally forwards to Sentry when SENTRY_DSN is set AND @sentry/node is
 *   installed. Neither is required to run; the app degrades gracefully.
 */
class ErrorTracker {
  private readonly logger = new Logger(ErrorTracker.name);
  private readonly recent: TrackedError[] = [];
  private readonly countsByType = new Map<string, number>();
  private readonly maxRecent = 100;
  private sentry: any = null;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;

    try {
      // Resolve via a variable so the optional dependency isn't required at
      // build time (no compile error when @sentry/node is absent).
      const moduleName = '@sentry/node';
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require(moduleName);
      Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development' });
      this.sentry = Sentry;
      this.logger.log('Sentry error tracking initialized');
    } catch (error) {
      this.logger.warn(
        `SENTRY_DSN is set but @sentry/node could not be initialized; using in-memory error tracking only: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  capture(error: any, context: TrackedErrorContext = {}): void {
    const name = error?.name || 'Error';
    const message = error?.message || 'Unknown error';

    this.countsByType.set(name, (this.countsByType.get(name) || 0) + 1);
    this.recent.unshift({ timestamp: new Date().toISOString(), name, message, ...context });
    if (this.recent.length > this.maxRecent) {
      this.recent.pop();
    }

    if (this.sentry) {
      try {
        this.sentry.captureException(error, { extra: context });
      } catch {
        // Never let error reporting throw.
      }
    }
  }

  getMetrics() {
    const errorsByType = Object.fromEntries(this.countsByType.entries());
    const totalErrors = Array.from(this.countsByType.values()).reduce((sum, n) => sum + n, 0);
    return {
      totalErrors,
      errorsByType,
      recentErrors: this.recent.slice(0, 20),
    };
  }
}

export const errorTracker = new ErrorTracker();
