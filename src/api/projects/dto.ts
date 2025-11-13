import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export enum ProjectStatus {
  Active = 'active',
  Completed = 'completed',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
}

export enum ProjectPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'Website Redesign' })
  @IsString() 
  @MinLength(1) 
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Project description', example: 'Complete redesign of company website' })
  @IsOptional() 
  @IsString() 
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Project status', 
    enum: ProjectStatus,
    example: ProjectStatus.Active
  })
  @IsOptional() 
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ 
    description: 'Project priority', 
    enum: ProjectPriority,
    example: ProjectPriority.Medium
  })
  @IsOptional() 
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiPropertyOptional({ description: 'Project progress (0-100)', example: 0 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress?: number;

  @ApiPropertyOptional({ description: 'Project budget in cents', example: 500000 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  budget?: number;

  @ApiPropertyOptional({ description: 'Amount spent in cents', example: 0 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  spent?: number;

  @ApiPropertyOptional({ description: 'Project start date', example: '2024-01-01T00:00:00Z' })
  @IsOptional() 
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Project end date', example: '2024-06-01T00:00:00Z' })
  @IsOptional() 
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Project tags', example: ['frontend', 'redesign'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Project visibility', example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name', example: 'Website Redesign v2' })
  @IsOptional()
  @IsString() 
  @MinLength(1) 
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Project description', example: 'Updated project description' })
  @IsOptional() 
  @IsString() 
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Project status', 
    enum: ProjectStatus,
    example: ProjectStatus.Active
  })
  @IsOptional() 
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ 
    description: 'Project priority', 
    enum: ProjectPriority,
    example: ProjectPriority.High
  })
  @IsOptional() 
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiPropertyOptional({ description: 'Project progress (0-100)', example: 75 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress?: number;

  @ApiPropertyOptional({ description: 'Project budget in cents', example: 750000 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  budget?: number;

  @ApiPropertyOptional({ description: 'Amount spent in cents', example: 150000 })
  @IsOptional() 
  @IsNumber() 
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  spent?: number;

  @ApiPropertyOptional({ description: 'Project start date', example: '2024-01-01T00:00:00Z' })
  @IsOptional() 
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Project end date', example: '2024-08-01T00:00:00Z' })
  @IsOptional() 
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Project tags', example: ['frontend', 'redesign', 'urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Project visibility', example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class AddProjectMemberDto {
  @ApiProperty({ description: 'User ID to add as member', example: 'user123' })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: 'Member role', 
    enum: ['member', 'admin', 'owner'],
    example: 'member'
  })
  @IsEnum(['member', 'admin', 'owner'])
  role: string;
}

export class RemoveProjectMemberDto {
  @ApiProperty({ description: 'User ID to remove from project', example: 'user123' })
  @IsString()
  @IsUUID()
  userId: string;
}

export class ProjectQueryDto {
  @ApiPropertyOptional({ description: 'Search term for project name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status', 
    enum: ProjectStatus
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by priority', 
    enum: ProjectPriority
  })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

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