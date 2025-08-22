import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export function CorrelationIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  const existing = req.headers['x-trace-id'] as string | undefined;
  (req as any).traceId = existing || randomUUID();
  next();
} 