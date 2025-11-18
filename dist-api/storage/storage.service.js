"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const redis_client_1 = require("../common/redis/redis.client");
const prisma_service_1 = require("../prisma/prisma.service");
const writeFile = (0, util_1.promisify)(fs.writeFile);
const unlink = (0, util_1.promisify)(fs.unlink);
const mkdir = (0, util_1.promisify)(fs.mkdir);
let StorageService = StorageService_1 = class StorageService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(StorageService_1.name);
        this.uploadDir = process.env.UPLOAD_DIR || './uploads';
        this.ensureUploadDir();
    }
    async uploadFile(tenantId, userId, file, metadata) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }
            // Generate unique filename
            const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
            const fileExtension = path.extname(file.originalname);
            const filename = `${fileHash}${fileExtension}`;
            // Create directory structure: uploads/tenantId/year/month/
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const dirPath = path.join(this.uploadDir, tenantId, String(year), month);
            await this.ensureDirectory(dirPath);
            const filePath = path.join(dirPath, filename);
            // Save file to disk
            await writeFile(filePath, file.buffer);
            // Validate that either noteId or projectId is provided
            if (!metadata.noteId && !metadata.projectId) {
                throw new common_1.BadRequestException('Either noteId or projectId must be provided');
            }
            // Save metadata to database
            const attachment = await this.prisma.tx.attachment.create({
                data: {
                    tenantId,
                    noteId: metadata.noteId || null,
                    projectId: metadata.projectId || null,
                    filename: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    path: filePath,
                    uploadedBy: userId,
                },
            });
            // Clear cache
            if (metadata.noteId) {
                await this.clearAttachmentCache(tenantId, metadata.noteId);
            }
            if (metadata.projectId) {
                // Clear project attachments cache - try to clear all possible query variations
                try {
                    // Clear stats cache
                    await this.redis.del(`storage:stats:${tenantId}`);
                    // Note: We can't use wildcards with mock Redis, so React Query invalidation on frontend will handle the rest
                }
                catch (error) {
                    this.logger.warn('Failed to clear cache', error);
                }
            }
            this.logger.log(`File uploaded: ${file.originalname} (${file.size} bytes)`);
            return attachment;
        }
        catch (error) {
            this.logger.error('Failed to upload file', error);
            throw new common_1.BadRequestException('Failed to upload file');
        }
    }
    async getAttachment(tenantId, attachmentId) {
        const attachment = await this.prisma.tx.attachment.findFirst({
            where: {
                id: attachmentId,
                tenantId,
            },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        return attachment;
    }
    async getAttachmentFile(tenantId, attachmentId) {
        const attachment = await this.getAttachment(tenantId, attachmentId);
        if (!fs.existsSync(attachment.path)) {
            throw new common_1.NotFoundException('File not found on disk');
        }
        return {
            attachment,
            stream: fs.createReadStream(attachment.path),
        };
    }
    async getNoteAttachments(tenantId, noteId, query) {
        const cacheKey = `attachments:${tenantId}:${noteId}:${JSON.stringify(query)}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = {
            tenantId,
            noteId,
        };
        if (query.mimeType) {
            where.mimeType = {
                contains: query.mimeType,
                mode: 'insensitive',
            };
        }
        if (query.search) {
            where.filename = {
                contains: query.search,
                mode: 'insensitive',
            };
        }
        const attachments = await this.prisma.tx.attachment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: query.limit || 25,
            skip: query.offset || 0,
        });
        const total = await this.prisma.tx.attachment.count({ where });
        const result = {
            attachments,
            total,
            hasMore: attachments.length === (query.limit || 25),
        };
        // Cache for 5 minutes
        await this.redis.setex(cacheKey, 300, JSON.stringify(result));
        return result;
    }
    async getProjectAttachments(tenantId, projectId, query) {
        const cacheKey = `attachments:${tenantId}:project:${projectId}:${JSON.stringify(query)}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const where = {
            tenantId,
            projectId,
        };
        if (query.mimeType) {
            where.mimeType = {
                contains: query.mimeType,
                mode: 'insensitive',
            };
        }
        if (query.search) {
            where.filename = {
                contains: query.search,
                mode: 'insensitive',
            };
        }
        const attachments = await this.prisma.tx.attachment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: query.limit || 25,
            skip: query.offset || 0,
        });
        const total = await this.prisma.tx.attachment.count({ where });
        const result = {
            attachments,
            total,
            hasMore: attachments.length === (query.limit || 25),
        };
        // Cache for 5 minutes
        await this.redis.setex(cacheKey, 300, JSON.stringify(result));
        return result;
    }
    async deleteAttachment(tenantId, attachmentId) {
        const attachment = await this.getAttachment(tenantId, attachmentId);
        // Delete file from disk
        if (fs.existsSync(attachment.path)) {
            await unlink(attachment.path);
        }
        // Delete from database
        await this.prisma.tx.attachment.delete({
            where: { id: attachmentId },
        });
        // Clear cache
        await this.clearAttachmentCache(tenantId, attachment.noteId);
        this.logger.log(`Attachment deleted: ${attachment.filename}`);
        return { success: true };
    }
    async getStorageStats(tenantId) {
        const cacheKey = `storage:stats:${tenantId}`;
        // Try to get from cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const stats = await this.prisma.tx.attachment.aggregate({
            where: { tenantId },
            _count: {
                id: true,
            },
            _sum: {
                sizeBytes: true,
            },
        });
        const byMimeType = await this.prisma.tx.attachment.groupBy({
            by: ['mimeType'],
            where: { tenantId },
            _count: {
                id: true,
            },
            _sum: {
                sizeBytes: true,
            },
        });
        const result = {
            totalFiles: stats._count.id,
            totalSizeBytes: stats._sum.sizeBytes || 0,
            totalSizeMB: (stats._sum.sizeBytes || 0) / (1024 * 1024),
            byMimeType: byMimeType.reduce((acc, item) => {
                acc[item.mimeType] = {
                    count: item._count.id,
                    sizeBytes: item._sum.sizeBytes || 0,
                    sizeMB: (item._sum.sizeBytes || 0) / (1024 * 1024),
                };
                return acc;
            }, {}),
        };
        // Cache for 10 minutes
        await this.redis.setex(cacheKey, 600, JSON.stringify(result));
        return result;
    }
    async cleanupOrphanedFiles() {
        this.logger.log('Starting cleanup of orphaned files...');
        const orphanedFiles = [];
        const uploadDir = this.uploadDir;
        // Walk through upload directory and find files not in database
        const walkDir = async (dir) => {
            const files = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const file of files) {
                const filePath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    await walkDir(filePath);
                }
                else {
                    // Check if file exists in database
                    const exists = await this.prisma.tx.attachment.findFirst({
                        where: { path: filePath },
                    });
                    if (!exists) {
                        orphanedFiles.push(filePath);
                    }
                }
            }
        };
        if (fs.existsSync(uploadDir)) {
            await walkDir(uploadDir);
        }
        // Delete orphaned files
        for (const filePath of orphanedFiles) {
            try {
                await unlink(filePath);
                this.logger.log(`Deleted orphaned file: ${filePath}`);
            }
            catch (error) {
                this.logger.error(`Failed to delete orphaned file: ${filePath}`, error);
            }
        }
        this.logger.log(`Cleanup completed. Deleted ${orphanedFiles.length} orphaned files.`);
        return {
            deletedFiles: orphanedFiles.length,
            orphanedFiles,
        };
    }
    async ensureUploadDir() {
        try {
            await mkdir(this.uploadDir, { recursive: true });
        }
        catch (error) {
            this.logger.error('Failed to create upload directory', error);
        }
    }
    async ensureDirectory(dirPath) {
        try {
            await mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            this.logger.error(`Failed to create directory: ${dirPath}`, error);
            throw error;
        }
    }
    async clearAttachmentCache(tenantId, noteId) {
        const keys = [
            `attachments:${tenantId}:${noteId}`,
            `storage:stats:${tenantId}`,
        ];
        await Promise.all(keys.map(key => this.redis.del(key)));
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_client_1.RedisClient])
], StorageService);
