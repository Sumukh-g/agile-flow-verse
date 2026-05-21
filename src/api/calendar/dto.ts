import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsCuid } from '../common/validators/cuid.validator';

export enum CalendarEventType {
  MEETING = 'MEETING',
  TASK_DEADLINE = 'TASK_DEADLINE',
  ISSUE_DUE = 'ISSUE_DUE',
  REMINDER = 'REMINDER',
  NOTE_DATE = 'NOTE_DATE',
  OTHER = 'OTHER',
}

export enum CalendarEventSourceType {
  TASK = 'TASK',
  ISSUE = 'ISSUE',
  NOTE = 'NOTE',
}

export enum CalendarScope {
  GLOBAL = 'global',
  PROJECT = 'project',
  SECTION = 'section',
}

export class CreateCalendarEventDto {
  @ApiProperty({ description: 'Event title', example: 'Team Meeting' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional({ description: 'Event description', example: 'Weekly team sync meeting' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ description: 'Event start date/time', example: '2024-02-15T10:00:00Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ description: 'Event end date/time', example: '2024-02-15T11:00:00Z' })
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional({ description: 'All-day event', example: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean = false;

  @ApiPropertyOptional({
    description: 'Event type',
    enum: CalendarEventType,
    example: CalendarEventType.MEETING,
  })
  @IsOptional()
  @IsEnum(CalendarEventType)
  type?: CalendarEventType = CalendarEventType.OTHER;

  @ApiPropertyOptional({ description: 'Project ID (for project-scoped events)' })
  @IsOptional()
  @IsString()
  @IsCuid()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Section ID (for section-scoped events)' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({
    description: 'Source type if linked to Task/Issue/Note',
    enum: CalendarEventSourceType,
  })
  @IsOptional()
  @IsEnum(CalendarEventSourceType)
  sourceType?: CalendarEventSourceType;

  @ApiPropertyOptional({ description: 'Source ID (Task/Issue/Note ID)' })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ description: 'Reminder minutes before event', example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080) // Max 7 days
  @Type(() => Number)
  reminderMinutesBefore?: number;
}

export class UpdateCalendarEventDto {
  @ApiPropertyOptional({ description: 'Event title', example: 'Updated Team Meeting' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Event start date/time' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: 'Event end date/time' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ description: 'All-day event' })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional({
    description: 'Event type',
    enum: CalendarEventType,
  })
  @IsOptional()
  @IsEnum(CalendarEventType)
  type?: CalendarEventType;

  @ApiPropertyOptional({ description: 'Reminder minutes before event' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  @Type(() => Number)
  reminderMinutesBefore?: number;
}

export class CalendarEventQueryDto {
  @ApiPropertyOptional({
    description: 'Scope: global, project, or section',
    enum: CalendarScope,
    example: CalendarScope.GLOBAL,
  })
  @IsOptional()
  @IsEnum(CalendarScope)
  scope?: CalendarScope = CalendarScope.GLOBAL;

  @ApiPropertyOptional({ description: 'Project ID (required for scope=project)' })
  @IsOptional()
  @IsString()
  @IsCuid()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Section ID (required for scope=section)' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Start date for range filter (ISO string)', example: '2024-02-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date for range filter (ISO string)', example: '2024-02-28T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filter by event types',
    type: [String],
    enum: CalendarEventType,
    example: [CalendarEventType.MEETING, CalendarEventType.TASK_DEADLINE],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CalendarEventType, { each: true })
  types?: CalendarEventType[];

  @ApiPropertyOptional({
    description: 'Filter by source type',
    enum: CalendarEventSourceType,
  })
  @IsOptional()
  @IsEnum(CalendarEventSourceType)
  sourceType?: CalendarEventSourceType;

  @ApiPropertyOptional({ description: 'Filter to personal events only (projectId is null)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  personalOnly?: boolean;

  @ApiPropertyOptional({ description: 'Exclude personal events (projectId is not null)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  excludePersonal?: boolean;
}

