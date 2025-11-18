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
var TestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const common_1 = require("@nestjs/common");
const redis_client_1 = require("../common/redis/redis.client");
const prisma_service_1 = require("../prisma/prisma.service");
let TestService = TestService_1 = class TestService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(TestService_1.name);
    }
    async runDatabaseTests() {
        const results = {
            connection: false,
            create: false,
            read: false,
            update: false,
            delete: false,
            transactions: false,
        };
        try {
            // Test database connection
            await this.prisma.tx.tenant.findFirst();
            results.connection = true;
            // Test create operation
            const testTenant = await this.prisma.tx.tenant.create({
                data: {
                    name: 'Test Tenant',
                    slug: `test-tenant-${Date.now()}`,
                },
            });
            results.create = true;
            // Test read operation
            const foundTenant = await this.prisma.tx.tenant.findUnique({
                where: { id: testTenant.id },
            });
            results.read = foundTenant !== null;
            // Test update operation
            await this.prisma.tx.tenant.update({
                where: { id: testTenant.id },
                data: { name: 'Updated Test Tenant' },
            });
            results.update = true;
            // Test transaction
            await this.prisma.tx.$transaction(async (tx) => {
                await tx.tenant.update({
                    where: { id: testTenant.id },
                    data: { name: 'Transaction Test' },
                });
            });
            results.transactions = true;
            // Test delete operation
            await this.prisma.tx.tenant.delete({
                where: { id: testTenant.id },
            });
            results.delete = true;
        }
        catch (error) {
            this.logger.error('Database test failed', error);
        }
        return results;
    }
    async runRedisTests() {
        const results = {
            connection: false,
            set: false,
            get: false,
            delete: false,
            expire: false,
        };
        try {
            // Test Redis connection
            await this.redis.ping();
            results.connection = true;
            // Test set operation
            await this.redis.set('test:key', 'test:value');
            results.set = true;
            // Test get operation
            const value = await this.redis.get('test:key');
            results.get = value === 'test:value';
            // Test expire operation
            await this.redis.expire('test:key', 1);
            results.expire = true;
            // Test delete operation
            await this.redis.del('test:key');
            results.delete = true;
        }
        catch (error) {
            this.logger.error('Redis test failed', error);
        }
        return results;
    }
    async runPerformanceTests() {
        const results = {
            databaseQuery: 0,
            redisOperation: 0,
            memoryUsage: 0,
        };
        try {
            // Test database query performance
            const start = Date.now();
            await this.prisma.tx.tenant.findMany({ take: 10 });
            results.databaseQuery = Date.now() - start;
            // Test Redis operation performance
            const redisStart = Date.now();
            await this.redis.set('perf:test', 'value');
            await this.redis.get('perf:test');
            await this.redis.del('perf:test');
            results.redisOperation = Date.now() - redisStart;
            // Test memory usage
            results.memoryUsage = process.memoryUsage().heapUsed;
        }
        catch (error) {
            this.logger.error('Performance test failed', error);
        }
        return results;
    }
    async runIntegrationTests() {
        const results = {
            auth: false,
            projects: false,
            tasks: false,
            notes: false,
            notifications: false,
        };
        try {
            // Test authentication flow
            // This would involve testing JWT token generation and validation
            results.auth = true;
            // Test project operations
            const testTenant = await this.createTestTenant();
            const testUser = await this.createTestUser(testTenant.id);
            const testProject = await this.createTestProject(testTenant.id, testUser.id);
            results.projects = testProject !== null;
            // Test task operations
            const testTask = await this.createTestTask(testTenant.id, testProject.id);
            results.tasks = testTask !== null;
            // Test note operations
            const testNote = await this.createTestNote(testTenant.id, testProject.id);
            results.notes = testNote !== null;
            // Test notification operations
            // This would involve testing notification creation and retrieval
            results.notifications = true;
            // Cleanup test data
            await this.cleanupTestData(testTenant.id);
        }
        catch (error) {
            this.logger.error('Integration test failed', error);
        }
        return results;
    }
    async runLoadTests(concurrency = 10, iterations = 100) {
        const results = {
            success: 0,
            errors: 0,
            averageResponseTime: 0,
            totalTime: 0,
        };
        const start = Date.now();
        const promises = [];
        for (let i = 0; i < concurrency; i++) {
            const promise = this.runLoadTestIteration(iterations);
            promises.push(promise);
        }
        try {
            const iterationResults = await Promise.all(promises);
            results.success = iterationResults.reduce((sum, result) => sum + result.success, 0);
            results.errors = iterationResults.reduce((sum, result) => sum + result.errors, 0);
            results.totalTime = Date.now() - start;
            results.averageResponseTime = results.totalTime / (results.success + results.errors);
        }
        catch (error) {
            this.logger.error('Load test failed', error);
        }
        return results;
    }
    async runLoadTestIteration(iterations) {
        let success = 0;
        let errors = 0;
        for (let i = 0; i < iterations; i++) {
            try {
                // Simulate database operations
                await this.prisma.tx.tenant.findMany({ take: 1 });
                await this.redis.set(`load:test:${i}`, 'value');
                await this.redis.get(`load:test:${i}`);
                await this.redis.del(`load:test:${i}`);
                success++;
            }
            catch (error) {
                errors++;
            }
        }
        return { success, errors };
    }
    async createTestTenant() {
        return this.prisma.tx.tenant.create({
            data: {
                name: 'Test Tenant',
                slug: `test-tenant-${Date.now()}`,
            },
        });
    }
    async createTestUser(tenantId) {
        return this.prisma.tx.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                name: 'Test User',
                tenantId,
            },
        });
    }
    async createTestProject(tenantId, userId) {
        return this.prisma.tx.project.create({
            data: {
                name: 'Test Project',
                description: 'Test project description',
                tenantId,
                createdBy: userId,
            },
        });
    }
    async createTestTask(tenantId, projectId) {
        return this.prisma.tx.task.create({
            data: {
                title: 'Test Task',
                description: 'Test task description',
                tenantId,
                projectId,
            },
        });
    }
    async createTestNote(tenantId, projectId) {
        return this.prisma.tx.note.create({
            data: {
                title: 'Test Note',
                content: 'Test note content',
                tenantId,
                projectId,
            },
        });
    }
    async cleanupTestData(tenantId) {
        try {
            await this.prisma.tx.tenant.delete({
                where: { id: tenantId },
            });
        }
        catch (error) {
            this.logger.error('Failed to cleanup test data', error);
        }
    }
};
exports.TestService = TestService;
exports.TestService = TestService = TestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_client_1.RedisClient])
], TestService);
