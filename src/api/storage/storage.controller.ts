import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Request,
    Res,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttachmentQueryDto, CreateAttachmentDto } from './dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    // Extract metadata from form data body (multer puts form fields in req.body)
    // Log for debugging
    console.log('[STORAGE] Upload request body:', JSON.stringify(req.body));
    console.log('[STORAGE] Upload file:', file?.originalname);
    
    const metadata: CreateAttachmentDto = {
      noteId: req.body?.noteId && req.body.noteId !== '' ? req.body.noteId : undefined,
      projectId: req.body?.projectId && req.body.projectId !== '' ? req.body.projectId : undefined,
    };
    
    console.log('[STORAGE] Extracted metadata:', JSON.stringify(metadata));
    
    return this.storageService.uploadFile(
      req.user.tenantId,
      req.user.userId,
      file,
      metadata,
    );
  }

  @Get('attachments/:id')
  @ApiOperation({ summary: 'Get attachment metadata' })
  @ApiResponse({ status: 200, description: 'Attachment metadata retrieved successfully' })
  async getAttachment(@Param('id') id: string, @Request() req: any) {
    return this.storageService.getAttachment(req.user.tenantId, id);
  }

  @Get('attachments/:id/download')
  @ApiOperation({ summary: 'Download attachment file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  async downloadAttachment(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { attachment, stream } = await this.storageService.getAttachmentFile(
      req.user.tenantId,
      id,
    );

    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
      'Content-Length': attachment.sizeBytes.toString(),
    });

    return new StreamableFile(stream);
  }

  @Get('notes/:noteId/attachments')
  @ApiOperation({ summary: 'Get note attachments' })
  @ApiResponse({ status: 200, description: 'Attachments retrieved successfully' })
  async getNoteAttachments(
    @Param('noteId') noteId: string,
    @Query() query: AttachmentQueryDto,
    @Request() req: any,
  ) {
    return this.storageService.getNoteAttachments(
      req.user.tenantId,
      noteId,
      query,
    );
  }

  @Get('projects/:projectId/attachments')
  @ApiOperation({ summary: 'Get project attachments' })
  @ApiResponse({ status: 200, description: 'Attachments retrieved successfully' })
  async getProjectAttachments(
    @Param('projectId') projectId: string,
    @Query() query: AttachmentQueryDto,
    @Request() req: any,
  ) {
    return this.storageService.getProjectAttachments(
      req.user.tenantId,
      projectId,
      query,
    );
  }

  @Delete('attachments/:id')
  @ApiOperation({ summary: 'Delete attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted successfully' })
  async deleteAttachment(@Param('id') id: string, @Request() req: any) {
    return this.storageService.deleteAttachment(req.user.tenantId, id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get storage statistics' })
  @ApiResponse({ status: 200, description: 'Storage statistics retrieved successfully' })
  async getStorageStats(@Request() req: any) {
    return this.storageService.getStorageStats(req.user.tenantId);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup orphaned files' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupOrphanedFiles(@Request() req: any) {
    return this.storageService.cleanupOrphanedFiles();
  }
}




