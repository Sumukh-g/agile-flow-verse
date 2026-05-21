import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { getRedis } from '../redis/redis.client';

const WINDOW_SECONDS = 120;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const keyHeader = (req.headers['idempotency-key'] as string) || '';
    const method = req.method.toUpperCase();

    // Only apply to mutating requests if key provided
    if (!keyHeader || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const tenantId = req.user?.tenantId || 'unknown';
    const redisKey = `idem:${tenantId}:${keyHeader}`;

    return from(this.handleIdempotency(redisKey, next, res));
  }

  private async handleIdempotency(redisKey: string, next: CallHandler, res: any) {
    const redis = getRedis();
    const cached = await redis.get(redisKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      res.status(parsed.status || 200);
      return parsed.body;
    }

    const result = await new Promise<any>((resolve, reject) => {
      next
        .handle()
        .pipe(
          map((body: any) => {
            resolve(body);
            return body;
          }),
        )
        .subscribe({ error: reject });
    });

    const status = res.statusCode || 200;
    await redis.setex(redisKey, WINDOW_SECONDS, JSON.stringify({ status, body: result }));

    return result;
  }
} 