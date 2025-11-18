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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveTaskDependencyDto = exports.AddTaskDependencyDto = exports.RemoveTaskAssigneeDto = exports.AddTaskAssigneeDto = exports.TaskQueryDto = exports.UpdateTaskDto = exports.CreateTaskDto = exports.TaskPriority = exports.TaskStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const cuid_validator_1 = require("../common/validators/cuid.validator");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["Todo"] = "todo";
    TaskStatus["InProgress"] = "in-progress";
    TaskStatus["Review"] = "review";
    TaskStatus["Done"] = "done";
    TaskStatus["Blocked"] = "blocked";
    TaskStatus["Cancelled"] = "cancelled";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["Low"] = "low";
    TaskPriority["Medium"] = "medium";
    TaskPriority["High"] = "high";
    TaskPriority["Critical"] = "critical";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class CreateTaskDto {
}
exports.CreateTaskDto = CreateTaskDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task title', example: 'Implement user authentication' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task description', example: 'Implement JWT-based authentication system' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task status',
        enum: TaskStatus,
        example: TaskStatus.Todo
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskStatus),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task priority',
        enum: TaskPriority,
        example: TaskPriority.Medium
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskPriority),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task due date', example: '2024-02-15T23:59:59Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estimated hours to complete', example: 8 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(999),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "estimatedHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Actual hours worked', example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(999),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "actualHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Project ID', example: 'cmhxzdxo60009kn2al64xkxiu' }),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User IDs assigned to this task',
        type: [String],
        example: ['cmhxlftcm000313xe0dk6dk08']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, cuid_validator_1.IsCuidArray)(),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "assigneeIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task IDs this task depends on',
        type: [String],
        example: ['cmhxzdxo60009kn2al64xkxiu']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, cuid_validator_1.IsCuidArray)(),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "dependencyIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task tags', example: ['frontend', 'auth'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task is blocked', example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTaskDto.prototype, "isBlocked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Block reason if task is blocked', example: 'Waiting for design approval' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "blockReason", void 0);
class UpdateTaskDto {
}
exports.UpdateTaskDto = UpdateTaskDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task title', example: 'Implement user authentication v2' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task description', example: 'Updated task description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task status',
        enum: TaskStatus,
        example: TaskStatus.InProgress
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskStatus),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task priority',
        enum: TaskPriority,
        example: TaskPriority.High
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskPriority),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task due date', example: '2024-02-20T23:59:59Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estimated hours to complete', example: 12 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(999),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "estimatedHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Actual hours worked', example: 4 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(999),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "actualHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User IDs assigned to this task',
        type: [String],
        example: ['cmhxlftcm000313xe0dk6dk08']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, cuid_validator_1.IsCuidArray)(),
    __metadata("design:type", Array)
], UpdateTaskDto.prototype, "assigneeIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task IDs this task depends on',
        type: [String],
        example: ['cmhxzdxo60009kn2al64xkxiu']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, cuid_validator_1.IsCuidArray)(),
    __metadata("design:type", Array)
], UpdateTaskDto.prototype, "dependencyIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task tags', example: ['frontend', 'auth', 'urgent'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateTaskDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task is blocked', example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTaskDto.prototype, "isBlocked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Block reason if task is blocked', example: 'Waiting for API documentation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "blockReason", void 0);
class TaskQueryDto {
    constructor() {
        this.limit = 25;
    }
}
exports.TaskQueryDto = TaskQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search term for task title or description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by project ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by status',
        enum: TaskStatus
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskStatus),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by priority',
        enum: TaskPriority
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskPriority),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by assignee user ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by due date (ISO string)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by tags' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TaskQueryDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', example: 25 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], TaskQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cursor for pagination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "cursor", void 0);
class AddTaskAssigneeDto {
}
exports.AddTaskAssigneeDto = AddTaskAssigneeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID to assign to task', example: 'cmhxlftcm000313xe0dk6dk08' }),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], AddTaskAssigneeDto.prototype, "userId", void 0);
class RemoveTaskAssigneeDto {
}
exports.RemoveTaskAssigneeDto = RemoveTaskAssigneeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID to remove from task', example: 'cmhxlftcm000313xe0dk6dk08' }),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], RemoveTaskAssigneeDto.prototype, "userId", void 0);
class AddTaskDependencyDto {
}
exports.AddTaskDependencyDto = AddTaskDependencyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task ID to add as dependency', example: 'cmhxzdxo60009kn2al64xkxiu' }),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], AddTaskDependencyDto.prototype, "taskId", void 0);
class RemoveTaskDependencyDto {
}
exports.RemoveTaskDependencyDto = RemoveTaskDependencyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task ID to remove as dependency', example: 'cmhxzdxo60009kn2al64xkxiu' }),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], RemoveTaskDependencyDto.prototype, "taskId", void 0);
