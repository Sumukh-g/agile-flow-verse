import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { requestContext } from '../common/tenant/request-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Initializing PrismaService...');
    await this.$connect();
    this.logger.log('PrismaService connected successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting PrismaService...');
    await this.$disconnect();
    this.logger.log('PrismaService disconnected');
  }

  // Helper to get the request-scoped transaction client if present
  get tx() {
    const store = requestContext.getStore();
    return (store?.prisma as PrismaClient) || this;
  }
} 