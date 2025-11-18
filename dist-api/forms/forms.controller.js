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
exports.FormsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const forms_service_1 = require("./forms.service");
const dto_1 = require("./dto");
let FormsController = class FormsController {
    constructor(svc) {
        this.svc = svc;
    }
    async list(projectId, req) {
        return this.svc.list(req.user.tenantId, projectId, req.user.userId);
    }
    async get(id, req) {
        return this.svc.get(req.user.tenantId, id, req.user.userId);
    }
    async create(body, req) {
        return this.svc.create(req.user.tenantId, req.user.userId, body);
    }
    async update(id, body, req) {
        return this.svc.update(req.user.tenantId, id, req.user.userId, body);
    }
    async delete(id, req) {
        return this.svc.delete(req.user.tenantId, id, req.user.userId);
    }
    async submitResponse(id, body, req) {
        return this.svc.submitResponse(req.user.tenantId, id, req.user.userId, body);
    }
    async listResponses(id, req) {
        return this.svc.listResponses(req.user.tenantId, id, req.user.userId);
    }
    async share(id, body, req) {
        return this.svc.share(req.user.tenantId, id, req.user.userId, body);
    }
    async listShares(id, req) {
        return this.svc.listShares(req.user.tenantId, id, req.user.userId);
    }
    async deleteShare(shareId, req) {
        return this.svc.deleteShare(req.user.tenantId, shareId, req.user.userId);
    }
    async incrementViews(id, req) {
        await this.svc.incrementViews(req.user.tenantId, id);
        return { ok: true };
    }
};
exports.FormsController = FormsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List forms', description: 'Get all forms for the tenant, optionally filtered by project' }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false, description: 'Filter by project ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Forms retrieved successfully' }),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get form by ID', description: 'Get a single form with all details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Form retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create form', description: 'Create a new form' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Form created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateFormDto, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update form', description: 'Update an existing form' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Form updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateFormDto, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete form', description: 'Delete a form and all its responses' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Form deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/responses'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit form response', description: 'Submit a response to a form' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Response submitted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SubmitFormResponseDto, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "submitResponse", null);
__decorate([
    (0, common_1.Get)(':id/responses'),
    (0, swagger_1.ApiOperation)({ summary: 'List form responses', description: 'Get all responses for a form (creator only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Responses retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "listResponses", null);
__decorate([
    (0, common_1.Post)(':id/shares'),
    (0, swagger_1.ApiOperation)({ summary: 'Share form', description: 'Share a form with a user or make it public' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Form shared successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ShareFormDto, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "share", null);
__decorate([
    (0, common_1.Get)(':id/shares'),
    (0, swagger_1.ApiOperation)({ summary: 'List form shares', description: 'Get all shares for a form (creator only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Shares retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "listShares", null);
__decorate([
    (0, common_1.Delete)('shares/:shareId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete form share', description: 'Remove a share from a form' }),
    (0, swagger_1.ApiParam)({ name: 'shareId', description: 'Share ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Share deleted successfully' }),
    __param(0, (0, common_1.Param)('shareId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "deleteShare", null);
__decorate([
    (0, common_1.Post)(':id/views'),
    (0, swagger_1.ApiOperation)({ summary: 'Increment form views', description: 'Increment the view count for a form' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Views incremented' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "incrementViews", null);
exports.FormsController = FormsController = __decorate([
    (0, swagger_1.ApiTags)('forms'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/forms'),
    __metadata("design:paramtypes", [forms_service_1.FormsService])
], FormsController);
