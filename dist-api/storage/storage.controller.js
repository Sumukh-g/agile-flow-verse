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
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const dto_1 = require("./dto");
const storage_service_1 = require("./storage.service");
let StorageController = class StorageController {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async uploadFile(file, req) {
        // Extract metadata from form data body (multer puts form fields in req.body)
        // Log for debugging
        console.log('[STORAGE] Upload request body:', JSON.stringify(req.body));
        console.log('[STORAGE] Upload file:', file?.originalname);
        const metadata = {
            noteId: req.body?.noteId && req.body.noteId !== '' ? req.body.noteId : undefined,
            projectId: req.body?.projectId && req.body.projectId !== '' ? req.body.projectId : undefined,
        };
        console.log('[STORAGE] Extracted metadata:', JSON.stringify(metadata));
        return this.storageService.uploadFile(req.user.tenantId, req.user.userId, file, metadata);
    }
    async getAttachment(id, req) {
        return this.storageService.getAttachment(req.user.tenantId, id);
    }
    async downloadAttachment(id, req, res) {
        const { attachment, stream } = await this.storageService.getAttachmentFile(req.user.tenantId, id);
        res.set({
            'Content-Type': attachment.mimeType,
            'Content-Disposition': `attachment; filename="${attachment.filename}"`,
            'Content-Length': attachment.sizeBytes.toString(),
        });
        return new common_1.StreamableFile(stream);
    }
    async getNoteAttachments(noteId, query, req) {
        return this.storageService.getNoteAttachments(req.user.tenantId, noteId, query);
    }
    async getProjectAttachments(projectId, query, req) {
        return this.storageService.getProjectAttachments(req.user.tenantId, projectId, query);
    }
    async deleteAttachment(id, req) {
        return this.storageService.deleteAttachment(req.user.tenantId, id);
    }
    async getStorageStats(req) {
        return this.storageService.getStorageStats(req.user.tenantId);
    }
    async cleanupOrphanedFiles(req) {
        return this.storageService.cleanupOrphanedFiles();
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a file' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'File uploaded successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('attachments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attachment metadata' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachment metadata retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getAttachment", null);
__decorate([
    (0, common_1.Get)('attachments/:id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download attachment file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File downloaded successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "downloadAttachment", null);
__decorate([
    (0, common_1.Get)('notes/:noteId/attachments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get note attachments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachments retrieved successfully' }),
    __param(0, (0, common_1.Param)('noteId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AttachmentQueryDto, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getNoteAttachments", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/attachments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get project attachments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachments retrieved successfully' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AttachmentQueryDto, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getProjectAttachments", null);
__decorate([
    (0, common_1.Delete)('attachments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete attachment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachment deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "deleteAttachment", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get storage statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Storage statistics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getStorageStats", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, swagger_1.ApiOperation)({ summary: 'Cleanup orphaned files' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cleanup completed successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "cleanupOrphanedFiles", null);
exports.StorageController = StorageController = __decorate([
    (0, swagger_1.ApiTags)('storage'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/storage'),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], StorageController);
