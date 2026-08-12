import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { errorTracker } from '../observability/error-tracker';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const traceId = (req.headers['x-trace-id'] as string) || (req as any).traceId;
    const code =
      exception?.response?.code ||
      (exception instanceof HttpException ? exception.name : 'InternalServerError');
    const message =
      exception?.response?.message ||
      exception?.message ||
      'An unexpected error occurred';

    const details = exception?.response?.details || undefined;

    // Log error for tracking
    const errorContext = {
      traceId,
      status,
      code,
      method: req.method,
      url: req.url,
      userId: (req as any).user?.id,
      tenantId: req.headers['x-tenant-id'],
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };

    if (status >= 500) {
      // Server errors - log with full context
      this.logger.error(
        `${code}: ${message}`,
        exception.stack,
        JSON.stringify(errorContext),
      );

      // Record for monitoring metrics and forward to Sentry when configured.
      errorTracker.capture(exception, {
        status,
        code,
        method: req.method,
        url: req.url,
        userId: (req as any).user?.userId,
        tenantId: (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string),
        traceId,
      });
    } else if (status >= 400) {
      // Client errors - log at warn level
      this.logger.warn(`${code}: ${message}`, JSON.stringify(errorContext));
    }

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldExposeDetails = !isProduction || status < 500;

    res.status(status).json({
      traceId,
      code,
      message: shouldExposeDetails ? message : 'An unexpected error occurred',
      ...(shouldExposeDetails && details ? { details } : {}),
      ...(shouldExposeDetails && !isProduction ? { stack: exception.stack } : {}),
    });
  }
} 