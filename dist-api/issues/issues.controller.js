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
exports.IssuesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const issues_service_1 = require("./issues.service");
const dto_1 = require("./dto");
let IssuesController = class IssuesController {
    constructor(svc) {
        this.svc = svc;
    }
    async create(data, req) {
        return this.svc.create(req.user.tenantId, req.user.userId, data);
    }
    async list(query, req) {
        return this.svc.list(req.user.tenantId, req.user.userId, query);
    }
    async get(id, req) {
        return this.svc.get(req.user.tenantId, req.user.userId, id);
    }
    async update(id, data, req) {
        return this.svc.update(req.user.tenantId, req.user.userId, id, data);
    }
    async delete(id, req) {
        return this.svc.delete(req.user.tenantId, req.user.userId, id);
    }
    async addComment(issueId, data, req) {
        return this.svc.addComment(req.user.tenantId, req.user.userId, issueId, data);
    }
    async getComments(issueId, req) {
        return this.svc.getComments(req.user.tenantId, req.user.userId, issueId);
    }
};
exports.IssuesController = IssuesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new issue' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Issue created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateIssueDto, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List issues' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of issues' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.IssueQueryDto, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get issue by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issue details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update issue' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issue updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateIssueDto, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete issue' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issue deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Add comment to issue' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Comment added successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateIssueCommentDto, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "addComment", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get issue comments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of comments' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IssuesController.prototype, "getComments", null);
exports.IssuesController = IssuesController = __decorate([
    (0, swagger_1.ApiTags)('Issues'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/issues'),
    __metadata("design:paramtypes", [issues_service_1.IssuesService])
], IssuesController);
