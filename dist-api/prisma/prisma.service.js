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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const request_context_1 = require("../common/tenant/request-context");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
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
        this.logger = new common_1.Logger(PrismaService_1.name);
        // Query logging (only in development)
        if (process.env.NODE_ENV === 'development') {
            this.$on('query', (e) => {
                if (parseInt(process.env.PRISMA_QUERY_LOG || '0')) {
                    this.logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
                }
            });
        }
        // Error logging
        this.$on('error', (e) => {
            this.logger.error('Prisma error:', e);
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Database connected successfully');
            // Test connection with a simple query
            await this.$queryRaw `SELECT 1`;
            this.logger.log('Database connection verified');
        }
        catch (error) {
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
        const store = request_context_1.requestContext.getStore();
        return store?.prisma || this;
    }
    // Health check method
    async healthCheck() {
        const start = Date.now();
        try {
            await this.$queryRaw `SELECT 1`;
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            return { status: 'unhealthy' };
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
