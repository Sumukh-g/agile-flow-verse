import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsCuid, IsCuidArray } from '../common/validators/cuid.validator';

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Review = 'review',
  Done = 'done',
  Blocked = 'blocked',
  Cancelled = 'cancelled',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Implement user authentication' })
  @IsString() 
  @MinLength(1) 
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional({ description: 'Task description', example: 'Implement JWT-based authentication system' })
  @IsOptional() 
  @IsString() 
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Task status', 
    enum: TaskStatus,
    example: TaskStatus.Todo
  })
  @IsOptional() 
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ 
    description: 'Task priority', 
    enum: TaskPriority,
    example: TaskPriority.Medium
  })
  @IsOptional() 
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Task due date', example: '2024-02-15T23:59:59Z' })
  @IsOptional() 
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Estimated hours to complete', example: 8 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Max(999)
  @Type(() => Number)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Actual hours worked', example: 0 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Max(999)
  @Type(() => Number)
  actualHours?: number;

  @ApiProperty({ description: 'Project ID', example: 'cmhxzdxo60009kn2al64xkxiu' })
  @IsString()
  @IsCuid()
  projectId!: string;

  @ApiPropertyOptional({ 
    description: 'User IDs assigned to this task', 
    type: [String],
    example: ['cmhxlftcm000313xe0dk6dk08']
  })
  @IsOptional() 
  @IsArray()
  @IsCuidArray()
  assigneeIds?: string[];

  @ApiPropertyOptional({ 
    description: 'Task IDs this task depends on', 
    type: [String],
    example: ['cmhxzdxo60009kn2al64xkxiu']
  })
  @IsOptional() 
  @IsArray()
  @IsCuidArray()
  dependencyIds?: string[];

  @ApiPropertyOptional({ description: 'Task tags', example: ['frontend', 'auth'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Task is blocked', example: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ description: 'Block reason if task is blocked', example: 'Waiting for design approval' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  blockReason?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title', example: 'Implement user authentication v2' })
  @IsOptional()
  @IsString() 
  @MinLength(1) 
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: 'Task description', example: 'Updated task description' })
  @IsOptional() 
  @IsString() 
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Task status', 
    enum: TaskStatus,
    example: TaskStatus.InProgress
  })
  @IsOptional() 
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ 
    description: 'Task priority', 
    enum: TaskPriority,
    example: TaskPriority.High
  })
  @IsOptional() 
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Task due date', example: '2024-02-20T23:59:59Z' })
  @IsOptional() 
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Estimated hours to complete', example: 12 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Max(999)
  @Type(() => Number)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Actual hours worked', example: 4 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Max(999)
  @Type(() => Number)
  actualHours?: number;

  @ApiPropertyOptional({ 
    description: 'User IDs assigned to this task', 
    type: [String],
    example: ['cmhxlftcm000313xe0dk6dk08']
  })
  @IsOptional() 
  @IsArray()
  @IsCuidArray()
  assigneeIds?: string[];

  @ApiPropertyOptional({ 
    description: 'Task IDs this task depends on', 
    type: [String],
    example: ['cmhxzdxo60009kn2al64xkxiu']
  })
  @IsOptional() 
  @IsArray()
  @IsCuidArray()
  dependencyIds?: string[];

  @ApiPropertyOptional({ description: 'Task tags', example: ['frontend', 'auth', 'urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Task is blocked', example: true })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ description: 'Block reason if task is blocked', example: 'Waiting for API documentation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  blockReason?: string;
}

export class TaskQueryDto {
  @ApiPropertyOptional({ description: 'Search term for task title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  @IsCuid()
  projectId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status', 
    enum: TaskStatus
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by priority', 
    enum: TaskPriority
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Filter by assignee user ID' })
  @IsOptional()
  @IsString()
  @IsCuid()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Filter by due date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Number of items per page', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class AddTaskAssigneeDto {
  @ApiProperty({ description: 'User ID to assign to task', example: 'cmhxlftcm000313xe0dk6dk08' })
  @IsString()
  @IsCuid()
  userId: string;
}

export class RemoveTaskAssigneeDto {
  @ApiProperty({ description: 'User ID to remove from task', example: 'cmhxlftcm000313xe0dk6dk08' })
  @IsString()
  @IsCuid()
  userId: string;
}

export class AddTaskDependencyDto {
  @ApiProperty({ description: 'Task ID to add as dependency', example: 'cmhxzdxo60009kn2al64xkxiu' })
  @IsString()
  @IsCuid()
  taskId: string;
}

export class RemoveTaskDependencyDto {
  @ApiProperty({ description: 'Task ID to remove as dependency', example: 'cmhxzdxo60009kn2al64xkxiu' })
  @IsString()
  @IsCuid()
  taskId: string;
} 