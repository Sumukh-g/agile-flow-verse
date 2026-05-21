import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsCuid } from '../common/validators/cuid.validator';

export class CreateIssueDto {
  @ApiProperty({ description: 'Project ID', example: 'cmhxzdxo60009kn2al64xkxiu' })
  @IsString()
  @IsCuid()
  projectId!: string;

  @ApiProperty({ description: 'Issue title', example: 'Fix login bug' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Issue description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Issue status', 
    enum: ['INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD'],
    default: 'INBOX'
  })
  @IsOptional()
  @IsEnum(['INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Issue priority', 
    enum: ['P0', 'P1', 'P2', 'P3'],
    default: 'P2'
  })
  @IsOptional()
  @IsEnum(['P0', 'P1', 'P2', 'P3'])
  priority?: string;

  @ApiPropertyOptional({ 
    description: 'Issue type', 
    enum: ['BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT'],
    default: 'TASK'
  })
  @IsOptional()
  @IsEnum(['BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT'])
  type?: string;

  @ApiPropertyOptional({ 
    description: 'Issue severity (for bugs)', 
    enum: ['CRITICAL', 'MAJOR', 'MINOR']
  })
  @IsOptional()
  @IsEnum(['CRITICAL', 'MAJOR', 'MINOR'])
  severity?: string;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsOptional()
  @IsString()
  @IsCuid()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Due date', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Component ID (optional area/component within project)' })
  @IsOptional()
  @IsString()
  componentId?: string;
}

export class UpdateIssueDto {
  @ApiPropertyOptional({ description: 'Issue title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Issue description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Issue status', 
    enum: ['INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD']
  })
  @IsOptional()
  @IsEnum(['INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Issue priority', 
    enum: ['P0', 'P1', 'P2', 'P3']
  })
  @IsOptional()
  @IsEnum(['P0', 'P1', 'P2', 'P3'])
  priority?: string;

  @ApiPropertyOptional({ 
    description: 'Issue type', 
    enum: ['BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT']
  })
  @IsOptional()
  @IsEnum(['BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT'])
  type?: string;

  @ApiPropertyOptional({ 
    description: 'Issue severity (for bugs)', 
    enum: ['CRITICAL', 'MAJOR', 'MINOR']
  })
  @IsOptional()
  @IsEnum(['CRITICAL', 'MAJOR', 'MINOR'])
  severity?: string;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsOptional()
  @IsString()
  @IsCuid()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Due date', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Component ID (optional area/component within project)' })
  @IsOptional()
  @IsString()
  componentId?: string;
}

export class IssueQueryDto {
  @ApiPropertyOptional({ description: 'Project ID to filter by' })
  @IsOptional()
  @IsString()
  @IsCuid()
  projectId?: string;

  @ApiPropertyOptional({ 
    description: 'Status filter', 
    enum: ['INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD']
  })
  @IsOptional()
  @IsEnum(['INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV', 'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Priority filter', 
    enum: ['P0', 'P1', 'P2', 'P3']
  })
  @IsOptional()
  @IsEnum(['P0', 'P1', 'P2', 'P3'])
  priority?: string;

  @ApiPropertyOptional({ 
    description: 'Type filter', 
    enum: ['BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT']
  })
  @IsOptional()
  @IsEnum(['BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT'])
  type?: string;

  @ApiPropertyOptional({ description: 'Assignee user ID filter' })
  @IsOptional()
  @IsString()
  @IsCuid()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Search term for title/description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tags filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Limit results', default: 25 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @Type(() => Number)
  offset?: number;

  @ApiPropertyOptional({ 
    description: 'Sort by field', 
    enum: ['createdAt', 'updatedAt', 'priority', 'dueDate'],
    default: 'createdAt'
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'priority', 'dueDate'])
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class CreateIssueCommentDto {
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  content!: string;
}

// ============================================
// Phase 8: Advanced Issue Features DTOs
// ============================================

export class CreateIssueLinkDto {
  @ApiProperty({ description: 'Target issue ID' })
  @IsString()
  @IsCuid()
  targetIssueId!: string;

  @ApiProperty({ 
    description: 'Link type',
    enum: ['BLOCKS', 'IS_BLOCKED_BY', 'DUPLICATES', 'IS_DUPLICATED_BY', 'RELATES_TO']
  })
  @IsEnum(['BLOCKS', 'IS_BLOCKED_BY', 'DUPLICATES', 'IS_DUPLICATED_BY', 'RELATES_TO'])
  linkType!: string;
}

export class DeleteIssueLinkDto {
  @ApiProperty({ description: 'Link ID to delete' })
  @IsString()
  @IsCuid()
  linkId!: string;
}

