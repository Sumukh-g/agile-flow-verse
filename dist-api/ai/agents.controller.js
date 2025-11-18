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
exports.AgentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_decorators_1 = require("../common/swagger/swagger.decorators");
const ai_service_1 = require("./ai.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_2 = require("@nestjs/common");
let AgentsController = class AgentsController {
    constructor(aiService, prisma) {
        this.aiService = aiService;
        this.prisma = prisma;
    }
    async chat(body, req) {
        const tenant = await this.prisma.tx.tenant.findUnique({ where: { id: req.user.tenantId } });
        const sku = tenant?.sku || 'basic';
        if (['basic', 'free'].includes(sku)) {
            throw new common_2.ForbiddenException('AI chat is available for Premium plans only.');
        }
        return this.aiService.chat(body);
    }
    async getAgents(req) {
        return this.prisma.tx.agent.findMany({
            where: { tenantId: req.user.tenantId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getAgent(id, req) {
        const agent = await this.prisma.tx.agent.findFirst({
            where: { id, tenantId: req.user.tenantId },
            include: {
                runs: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!agent) {
            throw new Error('Agent not found');
        }
        return agent;
    }
    async runAgent(body, req) {
        const { agentId, input } = body;
        const result = await this.aiService.runAgent(req.user.tenantId, agentId, input);
        return result;
    }
    async getAgentRuns(agentId, limit, req) {
        const where = { tenantId: req.user.tenantId };
        if (agentId) {
            where.agentId = agentId;
        }
        return this.prisma.tx.agentRun.findMany({
            where,
            take: limit ? parseInt(limit, 10) : 50,
            orderBy: { createdAt: 'desc' },
            include: {
                agent: true,
            },
        });
    }
    async getAgentRun(id, req) {
        const run = await this.prisma.tx.agentRun.findFirst({
            where: { id, tenantId: req.user.tenantId },
            include: {
                agent: true,
            },
        });
        if (!run) {
            throw new Error('Agent run not found');
        }
        return run;
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, swagger_1.ApiOperation)({
        summary: 'Chat with multi-provider models (OpenAI, Gemini, Perplexity)',
        description: 'Premium-only. Supports provider, model, and messages.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat response returned' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "chat", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all agents',
        description: 'Retrieves all available AI agents for the tenant.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agents retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get agent by ID',
        description: 'Retrieves a specific agent by ID.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Agent ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getAgent", null);
__decorate([
    (0, common_1.Post)('run'),
    (0, swagger_1.ApiOperation)({
        summary: 'Run an agent',
        description: 'Executes an agent with provided input and tracks the run.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent executed successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "runAgent", null);
__decorate([
    (0, common_1.Get)('runs'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get agent runs',
        description: 'Retrieves agent execution history, optionally filtered by agent.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'agentId', required: false, description: 'Filter by agent ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of runs to retrieve' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent runs retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('agentId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getAgentRuns", null);
__decorate([
    (0, common_1.Get)('runs/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get agent run by ID',
        description: 'Retrieves a specific agent run with full details.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Agent Run ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent run retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getAgentRun", null);
exports.AgentsController = AgentsController = __decorate([
    (0, swagger_1.ApiTags)('agents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/agents'),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        prisma_service_1.PrismaService])
], AgentsController);
