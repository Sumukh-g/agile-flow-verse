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
    enum: ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed'],
    default: 'backlog'
  })
  @IsOptional()
  @IsEnum(['backlog', 'todo', 'in-progress', 'review', 'done', 'closed'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Issue priority', 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @ApiPropertyOptional({ 
    description: 'Issue type', 
    enum: ['bug', 'feature', 'task', 'improvement'],
    default: 'task'
  })
  @IsOptional()
  @IsEnum(['bug', 'feature', 'task', 'improvement'])
  type?: string;

  @ApiPropertyOptional({ 
    description: 'Issue severity (for bugs)', 
    enum: ['minor', 'major', 'critical', 'blocker']
  })
  @IsOptional()
  @IsEnum(['minor', 'major', 'critical', 'blocker'])
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
    enum: ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed']
  })
  @IsOptional()
  @IsEnum(['backlog', 'todo', 'in-progress', 'review', 'done', 'closed'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Issue priority', 
    enum: ['low', 'medium', 'high', 'critical']
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @ApiPropertyOptional({ 
    description: 'Issue type', 
    enum: ['bug', 'feature', 'task', 'improvement']
  })
  @IsOptional()
  @IsEnum(['bug', 'feature', 'task', 'improvement'])
  type?: string;

  @ApiPropertyOptional({ 
    description: 'Issue severity (for bugs)', 
    enum: ['minor', 'major', 'critical', 'blocker']
  })
  @IsOptional()
  @IsEnum(['minor', 'major', 'critical', 'blocker'])
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
}

export class IssueQueryDto {
  @ApiPropertyOptional({ description: 'Project ID to filter by' })
  @IsOptional()
  @IsString()
  @IsCuid()
  projectId?: string;

  @ApiPropertyOptional({ 
    description: 'Status filter', 
    enum: ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed']
  })
  @IsOptional()
  @IsEnum(['backlog', 'todo', 'in-progress', 'review', 'done', 'closed'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Priority filter', 
    enum: ['low', 'medium', 'high', 'critical']
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @ApiPropertyOptional({ 
    description: 'Type filter', 
    enum: ['bug', 'feature', 'task', 'improvement']
  })
  @IsOptional()
  @IsEnum(['bug', 'feature', 'task', 'improvement'])
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

