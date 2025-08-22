import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export enum ProjectStatus {
  Active = 'active',
  Completed = 'completed',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
}

export class CreateProjectDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200)
  name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus }) @IsOptional() @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional() @IsOptional() @IsString()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  progress?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  budget?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  spent?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  startDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  endDate?: string;
}

export class UpdateProjectDto extends CreateProjectDto {} 