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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_decorators_1 = require("../common/swagger/swagger.decorators");
const ai_service_1 = require("./ai.service");
// no-op
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    // Chat endpoint is exposed via /v1/agents/chat in AgentsController for consistency.
    async generateTasks(body, req) {
        const { description, projectId } = body;
        // Get project context
        const project = await req.prisma.project.findUnique({
            where: { id: projectId, tenantId: req.user.tenantId },
        });
        const tasks = await this.aiService.generateTasksFromDescription(description, project);
        return { tasks };
    }
    async summarizeNotes(body, req) {
        const result = await this.aiService.runSummarizerAgent({
            type: 'notes',
            ids: body.noteIds,
        });
        return { summary: result.summary, count: result.count };
    }
    async generateUpdate(body, req) {
        const { projectId, timePeriod = 'this week' } = body;
        const project = await req.prisma.project.findUnique({
            where: { id: projectId, tenantId: req.user.tenantId },
            include: {
                tasks: {
                    take: 100,
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const message = await this.aiService.generateUpdateMessage(project, project.tasks, timePeriod);
        return { message };
    }
    async analyzeWorkflow(body, req) {
        const workflow = await req.prisma.workflow.findUnique({
            where: { id: body.workflowId, tenantId: req.user.tenantId },
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        const result = await this.aiService.analyzeWorkflow(workflow);
        return result;
    }
    async extractActionItems(body) {
        const items = await this.aiService.extractActionItems(body.text);
        return { items };
    }
    async getStatus() {
        return {
            configured: this.aiService.isConfigured(),
            provider: process.env.AI_PROVIDER || 'openai',
            model: process.env.AI_MODEL || 'gpt-4o-mini',
        };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('generate-tasks'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate tasks from description',
        description: 'Uses AI to generate a list of tasks based on a project description.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tasks generated successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateTasks", null);
__decorate([
    (0, common_1.Post)('summarize-notes'),
    (0, swagger_1.ApiOperation)({
        summary: 'Summarize notes',
        description: 'Uses AI to summarize multiple notes into a concise summary.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notes summarized successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "summarizeNotes", null);
__decorate([
    (0, common_1.Post)('generate-update'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate project update',
        description: 'Uses AI to generate a professional status update for a project.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Update generated successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateUpdate", null);
__decorate([
    (0, common_1.Post)('analyze-workflow'),
    (0, swagger_1.ApiOperation)({
        summary: 'Analyze workflow',
        description: 'Uses AI to analyze a workflow and provide improvement suggestions.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow analyzed successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyzeWorkflow", null);
__decorate([
    (0, common_1.Post)('extract-action-items'),
    (0, swagger_1.ApiOperation)({
        summary: 'Extract action items from text',
        description: 'Uses AI to extract actionable items from unstructured text.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Action items extracted successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "extractActionItems", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get AI service status',
        description: 'Check if AI service is properly configured and available.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'AI status retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getStatus", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('ai'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
