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
exports.CreateIssueCommentDto = exports.IssueQueryDto = exports.UpdateIssueDto = exports.CreateIssueDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const cuid_validator_1 = require("../common/validators/cuid.validator");
class CreateIssueDto {
}
exports.CreateIssueDto = CreateIssueDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Project ID', example: 'cmhxzdxo60009kn2al64xkxiu' }),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Issue title', example: 'Fix login bug' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Issue description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue status',
        enum: ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed'],
        default: 'backlog'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['backlog', 'todo', 'in-progress', 'review', 'done', 'closed']),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue priority',
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue type',
        enum: ['bug', 'feature', 'task', 'improvement'],
        default: 'task'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['bug', 'feature', 'task', 'improvement']),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue severity (for bugs)',
        enum: ['minor', 'major', 'critical', 'blocker']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['minor', 'major', 'critical', 'blocker']),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Assignee user ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tags', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateIssueDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Due date', type: String, format: 'date-time' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateIssueDto.prototype, "dueDate", void 0);
class UpdateIssueDto {
}
exports.UpdateIssueDto = UpdateIssueDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Issue title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Issue description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue status',
        enum: ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['backlog', 'todo', 'in-progress', 'review', 'done', 'closed']),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue priority',
        enum: ['low', 'medium', 'high', 'critical']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue type',
        enum: ['bug', 'feature', 'task', 'improvement']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['bug', 'feature', 'task', 'improvement']),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Issue severity (for bugs)',
        enum: ['minor', 'major', 'critical', 'blocker']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['minor', 'major', 'critical', 'blocker']),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Assignee user ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tags', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateIssueDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Due date', type: String, format: 'date-time' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateIssueDto.prototype, "dueDate", void 0);
class IssueQueryDto {
}
exports.IssueQueryDto = IssueQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Project ID to filter by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Status filter',
        enum: ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['backlog', 'todo', 'in-progress', 'review', 'done', 'closed']),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Priority filter',
        enum: ['low', 'medium', 'high', 'critical']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type filter',
        enum: ['bug', 'feature', 'task', 'improvement']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['bug', 'feature', 'task', 'improvement']),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Assignee user ID filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search term for title/description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tags filter', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], IssueQueryDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Limit results', default: 25 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], IssueQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Offset for pagination', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], IssueQueryDto.prototype, "offset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort by field',
        enum: ['createdAt', 'updatedAt', 'priority', 'dueDate'],
        default: 'createdAt'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['createdAt', 'updatedAt', 'priority', 'dueDate']),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort order',
        enum: ['asc', 'desc'],
        default: 'desc'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['asc', 'desc']),
    __metadata("design:type", String)
], IssueQueryDto.prototype, "sortOrder", void 0);
class CreateIssueCommentDto {
}
exports.CreateIssueCommentDto = CreateIssueCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Comment content' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIssueCommentDto.prototype, "content", void 0);
