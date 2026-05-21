import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { RedisClient } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { AttachmentQueryDto, CreateAttachmentDto } from './dto';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisClient,
    private readonly permissions: ProjectPermissionsService,
  ) {
    this.ensureUploadDir();
  }

  async uploadFile(
    tenantId: string,
    userId: string,
    file: Express.Multer.File | undefined,
    metadata: CreateAttachmentDto,
  ) {
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
        throw new BadRequestException('Either noteId or projectId must be provided');
      }

      // Check write permissions if projectId is provided (viewers cannot upload)
      if (metadata.projectId) {
        await this.permissions.ensureCanWriteProject(tenantId, userId, metadata.projectId);
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
        // Clear stats cache only (attachments are not cached in backend)
        try {
          await this.redis.del(`storage:stats:${tenantId}`);
          this.logger.log(`Cleared stats cache for project ${metadata.projectId}`);
        } catch (error) {
          this.logger.warn('Failed to clear cache', error);
        }
      }

      this.logger.log(`File uploaded: ${file.originalname} (${file.size} bytes)`);
      
      return attachment;
    } catch (error) {
      this.logger.error('Failed to upload file', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async getAttachment(tenantId: string, userId: string, attachmentId: string) {
    const attachment = await this.prisma.tx.attachment.findFirst({
      where: {
        id: attachmentId,
        tenantId,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check read permissions if projectId is provided (viewers can read)
    if (attachment.projectId) {
      await this.permissions.ensureCanReadProject(tenantId, userId, attachment.projectId);
    }

    return attachment;
  }

  async getAttachmentFile(tenantId: string, userId: string, attachmentId: string) {
    const attachment = await this.getAttachment(tenantId, userId, attachmentId);
    
    if (!fs.existsSync(attachment.path)) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      attachment,
      stream: fs.createReadStream(attachment.path),
    };
  }

  async getNoteAttachments(tenantId: string, noteId: string, query: AttachmentQueryDto) {
    const cacheKey = `attachments:${tenantId}:${noteId}:${JSON.stringify(query)}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
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

  async getProjectAttachments(tenantId: string, projectId: string, query: AttachmentQueryDto) {
    // Disable backend caching for attachments - React Query handles caching
    // This ensures fresh data immediately after uploads
    // Normalize query to ensure consistent cache keys (for potential future use)
    const normalizedQuery = {
      limit: query.limit || 25,
      offset: query.offset || 0,
      ...(query.mimeType && { mimeType: query.mimeType }),
      ...(query.search && { search: query.search }),
    };

    const where: any = {
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
      take: normalizedQuery.limit || 25,
      skip: normalizedQuery.offset || 0,
    });

    const total = await this.prisma.tx.attachment.count({ where });

    const result = {
      attachments,
      total,
      hasMore: attachments.length === (normalizedQuery.limit || 25),
    };

    // No backend caching - React Query handles all caching
    // This ensures immediate visibility of uploaded files
    this.logger.debug(`Fetched ${attachments.length} attachments for project ${projectId}`);

    return result;
  }

  async deleteAttachment(tenantId: string, userId: string, attachmentId: string) {
    const attachment = await this.getAttachment(tenantId, userId, attachmentId);
    
    // Check write permissions if projectId is provided (viewers cannot delete)
    if (attachment.projectId) {
      await this.permissions.ensureCanWriteProject(tenantId, userId, attachment.projectId);
    }
    
    // Delete file from disk
    if (fs.existsSync(attachment.path)) {
      await unlink(attachment.path);
    }

    // Delete from database
    await this.prisma.tx.attachment.delete({
      where: { id: attachmentId },
    });

    // Clear cache
    if (attachment.noteId) {
      await this.clearAttachmentCache(tenantId, attachment.noteId);
    }
    if (attachment.projectId) {
      // Clear stats cache only (attachments are not cached in backend)
      try {
        await this.redis.del(`storage:stats:${tenantId}`);
      } catch (error) {
        this.logger.warn('Failed to clear cache on delete', error);
      }
    }

    this.logger.log(`Attachment deleted: ${attachment.filename}`);
    
    return { success: true };
  }

  async getStorageStats(tenantId: string) {
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
      }, {} as Record<string, any>),
    };

    // Cache for 10 minutes
    await this.redis.setex(cacheKey, 600, JSON.stringify(result));

    return result;
  }

  async cleanupOrphanedFiles() {
    this.logger.log('Starting cleanup of orphaned files...');
    
    const orphanedFiles: string[] = [];
    const uploadDir = this.uploadDir;
    
    // Walk through upload directory and find files not in database
    const walkDir = async (dir: string) => {
      const files = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          await walkDir(filePath);
        } else {
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
      } catch (error) {
        this.logger.error(`Failed to delete orphaned file: ${filePath}`, error);
      }
    }

    this.logger.log(`Cleanup completed. Deleted ${orphanedFiles.length} orphaned files.`);
    
    return {
      deletedFiles: orphanedFiles.length,
      orphanedFiles,
    };
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create upload directory', error);
    }
  }

  private async ensureDirectory(dirPath: string) {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create directory: ${dirPath}`, error);
      throw error;
    }
  }

  private async clearAttachmentCache(tenantId: string, noteId: string) {
    const keys = [
      `attachments:${tenantId}:${noteId}`,
      `storage:stats:${tenantId}`,
    ];
    
    await Promise.all(keys.map(key => this.redis.del(key)));
  }
}




