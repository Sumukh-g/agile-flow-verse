import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { requestContext } from '../common/tenant/request-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Query logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        if (parseInt(process.env.PRISMA_QUERY_LOG || '0')) {
          this.logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
        }
      });
    }

    // Error logging
    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma error:', e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
      
      // Test connection with a simple query
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connection verified');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // Helper to get the request-scoped transaction client if present
  get tx() {
    const store = requestContext.getStore();
    return (store?.prisma as PrismaClient) || this;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
} 