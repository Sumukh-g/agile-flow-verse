import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from '@nestjs/common';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;
  private logLevel: LogLevel;

  constructor() {
    this.logger = new Logger('Application');
    this.logLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
        return LogLevel.WARN;
      case 'INFO':
        return LogLevel.INFO;
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'VERBOSE':
        return LogLevel.VERBOSE;
      default:
        return LogLevel.INFO;
    }
  }

  log(message: any, context?: string) {
    if (this.logLevel >= LogLevel.INFO) {
      this.logger.log(message, context);
    }
  }

  error(message: any, trace?: string, context?: string) {
    if (this.logLevel >= LogLevel.ERROR) {
      this.logger.error(message, trace, context);
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        this.sendToErrorTracking(message, trace, context);
      }
    }
  }

  warn(message: any, context?: string) {
    if (this.logLevel >= LogLevel.WARN) {
      this.logger.warn(message, context);
    }
  }

  debug(message: any, context?: string) {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.logger.debug(message, context);
    }
  }

  verbose(message: any, context?: string) {
    if (this.logLevel >= LogLevel.VERBOSE) {
      this.logger.verbose(message, context);
    }
  }

  private async sendToErrorTracking(message: any, trace?: string, context?: string) {
    // Integration point for Sentry/Datadog/etc
    // This would typically send errors to your error tracking service
    if (process.env.SENTRY_DSN) {
      // await Sentry.captureException(new Error(message), { extra: { trace, context } });
    }
    
    if (process.env.DATADOG_API_KEY) {
      // Send to Datadog
    }
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }
}

