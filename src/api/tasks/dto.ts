import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Review = 'review',
  Done = 'done',
}

export class CreateTaskDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(500)
  title!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional() @IsOptional() @IsString()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  actualHours?: number;

  @ApiProperty() @IsString()
  projectId!: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray()
  assigneeIds?: string[];

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray()
  dependencyIds?: string[];
}

export class UpdateTaskDto extends CreateTaskDto {} 