"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseOptimizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DatabaseOptimizationService = DatabaseOptimizationService_1 = class DatabaseOptimizationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DatabaseOptimizationService_1.name);
    }
    async onModuleInit() {
        if (process.env.NODE_ENV === 'production') {
            await this.optimizeDatabase();
        }
    }
    async optimizeDatabase() {
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
        }
        catch (error) {
            this.logger.warn('Database optimization failed (non-critical):', error);
        }
    }
    /**
     * Get database statistics for monitoring
     */
    async getDatabaseStats() {
        try {
            const stats = await this.prisma.$queryRaw `
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
        }
        catch (error) {
            this.logger.error('Failed to get database stats:', error);
            return [];
        }
    }
    /**
     * Vacuum specific table (manual cleanup)
     */
    async vacuumTable(tableName) {
        try {
            await this.prisma.$executeRawUnsafe(`VACUUM ANALYZE ${tableName};`);
            this.logger.log(`Vacuumed table: ${tableName}`);
        }
        catch (error) {
            this.logger.error(`Failed to vacuum table ${tableName}:`, error);
            throw error;
        }
    }
};
exports.DatabaseOptimizationService = DatabaseOptimizationService;
exports.DatabaseOptimizationService = DatabaseOptimizationService = DatabaseOptimizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DatabaseOptimizationService);
