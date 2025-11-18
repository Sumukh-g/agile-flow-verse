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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const test_service_1 = require("./test.service");
let TestController = class TestController {
    constructor(testService) {
        this.testService = testService;
    }
    async runDatabaseTests() {
        return this.testService.runDatabaseTests();
    }
    async runRedisTests() {
        return this.testService.runRedisTests();
    }
    async runPerformanceTests() {
        return this.testService.runPerformanceTests();
    }
    async runIntegrationTests() {
        return this.testService.runIntegrationTests();
    }
    async runLoadTests(concurrency, iterations) {
        return this.testService.runLoadTests(concurrency || 10, iterations || 100);
    }
    async runAllTests() {
        const [database, redis, performance, integration, load] = await Promise.all([
            this.testService.runDatabaseTests(),
            this.testService.runRedisTests(),
            this.testService.runPerformanceTests(),
            this.testService.runIntegrationTests(),
            this.testService.runLoadTests(5, 50),
        ]);
        return {
            database,
            redis,
            performance,
            integration,
            load,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.TestController = TestController;
__decorate([
    (0, common_1.Get)('database'),
    (0, swagger_1.ApiOperation)({ summary: 'Run database tests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Database tests completed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "runDatabaseTests", null);
__decorate([
    (0, common_1.Get)('redis'),
    (0, swagger_1.ApiOperation)({ summary: 'Run Redis tests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Redis tests completed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "runRedisTests", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Run performance tests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Performance tests completed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "runPerformanceTests", null);
__decorate([
    (0, common_1.Get)('integration'),
    (0, swagger_1.ApiOperation)({ summary: 'Run integration tests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Integration tests completed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "runIntegrationTests", null);
__decorate([
    (0, common_1.Post)('load'),
    (0, swagger_1.ApiOperation)({ summary: 'Run load tests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Load tests completed' }),
    __param(0, (0, common_1.Query)('concurrency')),
    __param(1, (0, common_1.Query)('iterations')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "runLoadTests", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Run all tests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All tests completed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "runAllTests", null);
exports.TestController = TestController = __decorate([
    (0, swagger_1.ApiTags)('testing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/test'),
    __metadata("design:paramtypes", [test_service_1.TestService])
], TestController);
