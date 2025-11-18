import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateAttachmentDto {
  @ApiPropertyOptional({ description: 'Note ID to attach file to', example: 'note123' })
  @IsOptional()
  @IsString()
  noteId?: string;

  @ApiPropertyOptional({ description: 'Project ID to attach file to', example: 'project123' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class AttachmentQueryDto {
  @ApiPropertyOptional({ description: 'Search term for filename' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by MIME type', example: 'image/png' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Number of items to skip', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class AttachmentResponseDto {
  @ApiProperty({ description: 'Attachment ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Note ID' })
  noteId: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  sizeBytes: number;

  @ApiProperty({ description: 'File path on server' })
  path: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}

export class StorageStatsDto {
  @ApiProperty({ description: 'Total number of files' })
  totalFiles: number;

  @ApiProperty({ description: 'Total size in bytes' })
  totalSizeBytes: number;

  @ApiProperty({ description: 'Total size in MB' })
  totalSizeMB: number;

  @ApiProperty({ description: 'Files grouped by MIME type' })
  byMimeType: Record<string, {
    count: number;
    sizeBytes: number;
    sizeMB: number;
  }>;
}

export class CleanupResultDto {
  @ApiProperty({ description: 'Number of deleted files' })
  deletedFiles: number;

  @ApiProperty({ description: 'List of orphaned file paths' })
  orphanedFiles: string[];
}





