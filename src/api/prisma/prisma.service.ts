import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { requestContext } from '../common/tenant/request-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper to get the request-scoped transaction client if present
  get tx() {
    const store = requestContext.getStore();
    return (store?.prisma as PrismaClient) || this;
  }
} 