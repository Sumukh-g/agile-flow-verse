import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTimesheetDto {
  @IsString()
  taskId: string;

  @IsDateString()
  date: string;

  @IsNumber()
  hours: number;

  @IsOptional()
  @IsString()
  description?: string;
} 