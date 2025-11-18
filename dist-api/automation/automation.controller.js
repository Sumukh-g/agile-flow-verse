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
exports.AutomationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_decorators_1 = require("../common/swagger/swagger.decorators");
const workflow_service_1 = require("./workflow.service");
let AutomationController = class AutomationController {
    constructor(workflowService) {
        this.workflowService = workflowService;
    }
    async createWorkflow(body, req) {
        return this.workflowService.createWorkflow(req.user.tenantId, body);
    }
    async getWorkflows(projectId, req) {
        return this.workflowService.getWorkflows(req.user.tenantId, projectId);
    }
    async updateWorkflow(id, body, req) {
        return this.workflowService.updateWorkflow(req.user.tenantId, id, body);
    }
    async deleteWorkflow(id, req) {
        await this.workflowService.deleteWorkflow(req.user.tenantId, id);
        return { ok: true };
    }
    async testWorkflow(id, sampleData, req) {
        return this.workflowService.testWorkflow(req.user.tenantId, id, sampleData);
    }
};
exports.AutomationController = AutomationController;
__decorate([
    (0, common_1.Post)('workflows'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create workflow',
        description: 'Creates a new automation workflow with triggers, conditions, and actions.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workflow created successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "createWorkflow", null);
__decorate([
    (0, common_1.Get)('workflows'),
    (0, swagger_1.ApiOperation)({
        summary: 'List workflows',
        description: 'Retrieves all workflows for the tenant, optionally filtered by project.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflows retrieved successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "getWorkflows", null);
__decorate([
    (0, common_1.Put)('workflows/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update workflow',
        description: 'Updates an existing workflow.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Workflow ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow updated successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "updateWorkflow", null);
__decorate([
    (0, common_1.Delete)('workflows/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete workflow',
        description: 'Deletes a workflow permanently.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Workflow ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow deleted successfully' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "deleteWorkflow", null);
__decorate([
    (0, common_1.Post)('workflows/:id/test'),
    (0, swagger_1.ApiOperation)({
        summary: 'Test workflow',
        description: 'Tests a workflow with sample data without actually executing actions.',
    }),
    (0, swagger_decorators_1.ApiIdParam)('Workflow ID'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow test completed' }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "testWorkflow", null);
exports.AutomationController = AutomationController = __decorate([
    (0, swagger_1.ApiTags)('automation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/automation'),
    __metadata("design:paramtypes", [workflow_service_1.WorkflowService])
], AutomationController);
