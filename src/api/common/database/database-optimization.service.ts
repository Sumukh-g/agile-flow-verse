import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatabaseOptimizationService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseOptimizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') {
      await this.optimizeDatabase();
    }
  }

  private async optimizeDatabase() {
    try {
      // Analyze tables for query optimization
      await this.prisma.$executeRawUnsafe(`
        ANALYZE tenants;
        ANALYZE projects;
        ANALYZE tasks;
        ANALYZE notes;
        ANALYZE notifications;
        ANALYZE outbox;
      `);

      this.logger.log('Database optimization completed');
    } catch (error) {
      this.logger.warn('Database optimization failed (non-critical):', error);
    }
  }

  /**
   * Get database statistics for monitoring
   */
  async getDatabaseStats() {
    try {
      const stats = await this.prisma.$queryRaw<Array<{
        schemaname: string;
        tablename: string;
        n_live_tup: bigint;
        n_dead_tup: bigint;
        last_vacuum: Date | null;
        last_autovacuum: Date | null;
        last_analyze: Date | null;
        last_autoanalyze: Date | null;
      }>>`
        SELECT 
          schemaname,
          tablename,
          n_live_tup,
          n_dead_tup,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC;
      `;

      return stats;
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return [];
    }
  }

  /**
   * Vacuum specific table (manual cleanup)
   */
  async vacuumTable(tableName: string) {
    try {
      await this.prisma.$executeRawUnsafe(`VACUUM ANALYZE ${tableName};`);
      this.logger.log(`Vacuumed table: ${tableName}`);
    } catch (error) {
      this.logger.error(`Failed to vacuum table ${tableName}:`, error);
      throw error;
    }
  }
}

