import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ErrorFilter implements ExceptionFilter {
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

    res.status(status).json({
      traceId,
      code,
      message,
      details,
    });
  }
} 