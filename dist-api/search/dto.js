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
exports.SearchSuggestionDto = exports.SearchResultDto = exports.SearchQueryDto = exports.SearchType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var SearchType;
(function (SearchType) {
    SearchType["ALL"] = "all";
    SearchType["NOTES"] = "notes";
    SearchType["TASKS"] = "tasks";
    SearchType["PROJECTS"] = "projects";
    SearchType["USERS"] = "users";
})(SearchType || (exports.SearchType = SearchType = {}));
class SearchQueryDto {
    constructor() {
        this.limit = 25;
        this.offset = 0;
    }
}
exports.SearchQueryDto = SearchQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search query string', example: 'authentication' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type of entities to search',
        enum: SearchType,
        example: SearchType.ALL
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SearchType),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by project ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by priority' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', example: 25 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items to skip', example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "offset", void 0);
class SearchResultDto {
}
exports.SearchResultDto = SearchResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Note search results' }),
    __metadata("design:type", Object)
], SearchResultDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task search results' }),
    __metadata("design:type", Object)
], SearchResultDto.prototype, "tasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Project search results' }),
    __metadata("design:type", Object)
], SearchResultDto.prototype, "projects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User search results' }),
    __metadata("design:type", Object)
], SearchResultDto.prototype, "users", void 0);
class SearchSuggestionDto {
}
exports.SearchSuggestionDto = SearchSuggestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Suggestion type', example: 'project' }),
    __metadata("design:type", String)
], SearchSuggestionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Suggestion text', example: 'Website Redesign' }),
    __metadata("design:type", String)
], SearchSuggestionDto.prototype, "text", void 0);
