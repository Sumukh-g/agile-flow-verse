import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsJSON, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export enum NoteScopeDto {
  PERSONAL = 'PERSONAL',
  PROJECT = 'PROJECT',
}

export class CreateNoteDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(300)
  title!: string;

  @ApiProperty({ description: 'Rich text JSON' }) @IsJSON()
  content!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  parentId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: NoteScopeDto, default: NoteScopeDto.PERSONAL })
  @IsOptional()
  @IsEnum(NoteScopeDto)
  scope?: NoteScopeDto;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray()
  tags?: string[];
}

export class UpdateNoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ description: 'Rich text JSON' }) @IsOptional() @IsJSON()
  content?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  parentId?: string;

  @ApiPropertyOptional({ enum: NoteScopeDto })
  @IsOptional()
  @IsEnum(NoteScopeDto)
  scope?: NoteScopeDto;

  @ApiPropertyOptional() @IsOptional() @IsString()
  projectId?: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray()
  tags?: string[];
}

export class NotesListQueryDto {
  @ApiPropertyOptional({ description: 'Project ID for project-scoped notes' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    enum: NoteScopeDto,
    description: 'Scope filter. Accepts personal|project (case-insensitive).',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().toUpperCase();
    return normalized.length > 0 ? normalized : undefined;
  })
  @IsEnum(NoteScopeDto)
  scope?: NoteScopeDto;

  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Page size', minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  })
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}