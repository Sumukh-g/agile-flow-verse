import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TenantAdminGuard
 *
 * Allows the request only if the authenticated user holds a tenant
 * admin/owner role within their own tenant. Intended for administrative and
 * infrastructure endpoints (monitoring, workspace-wide operations).
 *
 * Must run after JwtAuthGuard so `req.user` is populated.
 */
@Injectable()
export class TenantAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.userId || !user?.tenantId) {
      throw new ForbiddenException('Not authenticated');
    }

    const assignment = await this.prisma.roleAssignment.findFirst({
      where: {
        tenantId: user.tenantId,
        userId: user.userId,
        role: { permissions: { hasSome: ['tenant.admin', 'tenant.owner'] } },
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException('Tenant administrator access required');
    }

    return true;
  }
}
