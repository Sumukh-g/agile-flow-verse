/**
 * Frontend error tracking and reporting
 * Integrates with Sentry or other error tracking services
 */

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

class ErrorTracker {
  private initialized = false;
  private context: ErrorContext = {};
  private sentryAvailable = false;

  async init(dsn?: string) {
    if (this.initialized) return;

    // Initialize Sentry if DSN provided
    if (dsn && typeof window !== 'undefined') {
      try {
        // Use dynamic import with string template to prevent Vite from analyzing it
        const sentryModule = '@sentry/react';
        const Sentry = await import(/* @vite-ignore */ sentryModule).catch(() => null);
        
        if (Sentry) {
          this.sentryAvailable = true;
          Sentry.init({
            dsn,
            environment: import.meta.env.MODE,
            tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
            beforeSend: (event, hint) => {
              // Add custom context
              if (event.contexts) {
                event.contexts.custom = {
                  ...this.context,
                  ...event.contexts.custom,
                };
              }
              return event;
            },
          });
          this.initialized = true;
        }
      } catch (error) {
        console.warn('Failed to initialize error tracking:', error);
      }
    }
  }

  async setContext(context: Partial<ErrorContext>) {
    this.context = { ...this.context, ...context };
    
    if (this.initialized && this.sentryAvailable && typeof window !== 'undefined') {
      try {
        const sentryModule = '@sentry/react';
        const Sentry = await import(/* @vite-ignore */ sentryModule).catch(() => null);
        if (Sentry) {
          Sentry.setContext('custom', this.context);
        }
      } catch (error) {
        // Silently fail
      }
    }
  }

  async captureException(error: Error, context?: Partial<ErrorContext>) {
    const errorContext = { ...this.context, ...context };
    
    if (this.initialized && this.sentryAvailable && typeof window !== 'undefined') {
      try {
        const sentryModule = '@sentry/react';
        const Sentry = await import(/* @vite-ignore */ sentryModule).catch(() => null);
        if (Sentry) {
          Sentry.captureException(error, {
            contexts: { custom: errorContext },
          });
        }
      } catch (err) {
        // Fallback logging
        console.error('Error captured:', error, errorContext);
      }
    } else {
      // Fallback logging
      console.error('Error captured:', error, errorContext);
    }
  }

  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Partial<ErrorContext>) {
    const errorContext = { ...this.context, ...context };
    
    if (this.initialized && this.sentryAvailable && typeof window !== 'undefined') {
      try {
        const sentryModule = '@sentry/react';
        const Sentry = await import(/* @vite-ignore */ sentryModule).catch(() => null);
        if (Sentry) {
          Sentry.captureMessage(message, {
            level: level as any,
            contexts: { custom: errorContext },
          });
        }
      } catch (err) {
        console[level]('Message captured:', message, errorContext);
      }
    } else {
      console[level]('Message captured:', message, errorContext);
    }
  }

  async addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: any) {
    if (this.initialized && this.sentryAvailable && typeof window !== 'undefined') {
      try {
        const sentryModule = '@sentry/react';
        const Sentry = await import(/* @vite-ignore */ sentryModule).catch(() => null);
        if (Sentry) {
          Sentry.addBreadcrumb({
            message,
            category,
            level: level as any,
            data,
          });
        }
      } catch (err) {
        // Silently fail
      }
    }
  }
}

export const errorTracker = new ErrorTracker();

// Initialize on module load if DSN is available
if (typeof window !== 'undefined') {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    errorTracker.init(sentryDsn);
  }
}

