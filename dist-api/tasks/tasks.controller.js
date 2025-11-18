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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_decorators_1 = require("../common/swagger/swagger.decorators");
const cursor_1 = require("../common/pagination/cursor");
const dto_1 = require("./dto");
const tasks_service_1 = require("./tasks.service");
let TasksController = class TasksController {
    constructor(svc) {
        this.svc = svc;
    }
    async create(body, req) {
        return this.svc.create(req.user.tenantId, req.user.userId, body);
    }
    async list(projectId, cursor, limit, req) {
        return this.svc.list(req.user.tenantId, projectId, (0, cursor_1.decodeCursor)(cursor), limit ? Number(limit) : 25);
    }
    async get(id, req) {
        return this.svc.get(req.user.tenantId, req.user.userId, id);
    }
    async update(id, body, req) {
        return this.svc.update(req.user.tenantId, req.user.userId, id, body);
    }
    async delete(id, req) {
        return this.svc.delete(req.user.tenantId, req.user.userId, id);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new task',
        description: 'Creates a new task in a project. Supports task dependencies and assignees.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Task created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'clx1234567890abcdef' },
                title: { type: 'string', example: 'Implement user authentication' },
                status: { type: 'string', example: 'todo' },
                priority: { type: 'string', example: 'medium' },
                projectId: { type: 'string', example: 'proj123' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List tasks',
        description: 'Retrieves a paginated list of tasks. Can be filtered by project ID.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'projectId',
        required: false,
        description: 'Filter tasks by project ID',
        type: String,
    }),
    (0, swagger_decorators_1.ApiPaginationQuery)(),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tasks retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Task' },
                },
                nextCursor: { type: 'string', nullable: true },
            },
        },
    }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get task by ID',
        description: 'Retrieves a single task by its ID including all relationships.'
    }),
    (0, swagger_decorators_1.ApiIdParam)('Task ID'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Task retrieved successfully',
        schema: { $ref: '#/components/schemas/Task' },
    }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update a task',
        description: 'Updates an existing task. Only provided fields will be updated.'
    }),
    (0, swagger_decorators_1.ApiIdParam)('Task ID'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Task updated successfully',
        schema: { $ref: '#/components/schemas/Task' },
    }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a task',
        description: 'Permanently deletes a task and all its relationships.'
    }),
    (0, swagger_decorators_1.ApiIdParam)('Task ID'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Task deleted successfully',
        schema: {
            type: 'object',
            properties: {
                ok: { type: 'boolean', example: true },
            },
        },
    }),
    (0, swagger_decorators_1.ApiStandardResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "delete", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)('tasks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
