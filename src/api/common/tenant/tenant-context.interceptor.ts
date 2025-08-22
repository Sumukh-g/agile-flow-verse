import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { from, lastValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { requestContext } from './request-context';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const traceId = (req as any).traceId;
    const tenantId = (req.headers['x-tenant-id'] as string) || req.user?.tenantId;
    const userId = req.user?.userId || null;
    const roles: string[] = Array.isArray(req.user?.roles)
      ? req.user?.roles
      : typeof req.user?.roles === 'string'
      ? (req.user.roles as string).split(',').map((r) => r.trim())
      : [];

    // Wrap each request in a single transaction and set RLS session vars
    return from(
      this.prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          "select set_config('app.tenant_id', $1, true)",
          tenantId || '',
        );
        await tx.$executeRawUnsafe(
          "select set_config('app.roles', $1, true)",
          roles.join(','),
        );

        return await requestContext.run(
          {
            traceId,
            tenantId: tenantId || '',
            userId,
            roles,
            prisma: tx,
          },
          async () => {
            return await lastValueFrom(next.handle());
          },
        );
      }),
    );
  }
} 