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
exports.CleanupResultDto = exports.StorageStatsDto = exports.AttachmentResponseDto = exports.AttachmentQueryDto = exports.CreateAttachmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateAttachmentDto {
}
exports.CreateAttachmentDto = CreateAttachmentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Note ID to attach file to', example: 'note123' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "noteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Project ID to attach file to', example: 'project123' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "projectId", void 0);
class AttachmentQueryDto {
    constructor() {
        this.limit = 25;
        this.offset = 0;
    }
}
exports.AttachmentQueryDto = AttachmentQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search term for filename' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachmentQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by MIME type', example: 'image/png' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachmentQueryDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', example: 25 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AttachmentQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items to skip', example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AttachmentQueryDto.prototype, "offset", void 0);
class AttachmentResponseDto {
}
exports.AttachmentResponseDto = AttachmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Attachment ID' }),
    __metadata("design:type", String)
], AttachmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant ID' }),
    __metadata("design:type", String)
], AttachmentResponseDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Note ID' }),
    __metadata("design:type", String)
], AttachmentResponseDto.prototype, "noteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Original filename' }),
    __metadata("design:type", String)
], AttachmentResponseDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MIME type' }),
    __metadata("design:type", String)
], AttachmentResponseDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File size in bytes' }),
    __metadata("design:type", Number)
], AttachmentResponseDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File path on server' }),
    __metadata("design:type", String)
], AttachmentResponseDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], AttachmentResponseDto.prototype, "createdAt", void 0);
class StorageStatsDto {
}
exports.StorageStatsDto = StorageStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of files' }),
    __metadata("design:type", Number)
], StorageStatsDto.prototype, "totalFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total size in bytes' }),
    __metadata("design:type", Number)
], StorageStatsDto.prototype, "totalSizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total size in MB' }),
    __metadata("design:type", Number)
], StorageStatsDto.prototype, "totalSizeMB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Files grouped by MIME type' }),
    __metadata("design:type", Object)
], StorageStatsDto.prototype, "byMimeType", void 0);
class CleanupResultDto {
}
exports.CleanupResultDto = CleanupResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of deleted files' }),
    __metadata("design:type", Number)
], CleanupResultDto.prototype, "deletedFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of orphaned file paths' }),
    __metadata("design:type", Array)
], CleanupResultDto.prototype, "orphanedFiles", void 0);
