import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      // Set the tenant context in PostgreSQL session
      await this.prisma.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, false)`;
    }

    next();
  }
} 