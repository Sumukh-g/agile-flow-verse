import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum EventVisibility {
  DEFAULT = 'default',
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

// Calendar DTOs
export class CreateCalendarDto {
  @ApiProperty({ description: 'Calendar name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Calendar color', default: '#3b82f6' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Whether this is the default calendar', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Whether this calendar is shared', default: false })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @ApiProperty({ description: 'Section ID for organization' })
  @IsString()
  @IsOptional()
  sectionId?: string;
}

export class UpdateCalendarDto {
  @ApiProperty({ description: 'Calendar name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Calendar color' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Whether this is the default calendar' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Whether this calendar is shared' })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @ApiProperty({ description: 'Section ID for organization' })
  @IsString()
  @IsOptional()
  sectionId?: string;
}

export class CalendarFiltersDto {
  @ApiProperty({ description: 'Filter by section ID' })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ description: 'Filter by owner user ID' })
  @IsString()
  @IsOptional()
  ownerUserId?: string;

  @ApiProperty({ description: 'Filter by shared status' })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}

// Event DTOs
export class CreateEventDto {
  @ApiProperty({ description: 'Calendar ID' })
  @IsString()
  calendarId: string;

  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Event location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Whether this is an all-day event', default: false })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiProperty({ description: 'Event start date/time' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ description: 'Event end date/time' })
  @IsDateString()
  endAt: string;

  @ApiProperty({ description: 'RRULE string for recurring events' })
  @IsString()
  @IsOptional()
  rrule?: string;

  @ApiProperty({ description: 'Exception dates for recurring events' })
  @IsString()
  @IsOptional()
  exDates?: string;

  @ApiProperty({ description: 'Event timezone', default: 'UTC' })
  @IsString()
  @IsOptional()
  timeZone?: string;

  @ApiProperty({ description: 'Reminder settings' })
  @IsArray()
  @IsOptional()
  reminders?: any[];

  @ApiProperty({ description: 'Attendee information' })
  @IsArray()
  @IsOptional()
  attendees?: any[];

  @ApiProperty({ description: 'Event visibility', enum: EventVisibility, default: EventVisibility.DEFAULT })
  @IsEnum(EventVisibility)
  @IsOptional()
  visibility?: EventVisibility;
}

export class UpdateEventDto {
  @ApiProperty({ description: 'Calendar ID' })
  @IsString()
  @IsOptional()
  calendarId?: string;

  @ApiProperty({ description: 'Event title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Event location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Whether this is an all-day event' })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiProperty({ description: 'Event start date/time' })
  @IsDateString()
  @IsOptional()
  startAt?: string;

  @ApiProperty({ description: 'Event end date/time' })
  @IsDateString()
  @IsOptional()
  endAt?: string;

  @ApiProperty({ description: 'RRULE string for recurring events' })
  @IsString()
  @IsOptional()
  rrule?: string;

  @ApiProperty({ description: 'Exception dates for recurring events' })
  @IsString()
  @IsOptional()
  exDates?: string;

  @ApiProperty({ description: 'Event timezone' })
  @IsString()
  @IsOptional()
  timeZone?: string;

  @ApiProperty({ description: 'Reminder settings' })
  @IsArray()
  @IsOptional()
  reminders?: any[];

  @ApiProperty({ description: 'Attendee information' })
  @IsArray()
  @IsOptional()
  attendees?: any[];

  @ApiProperty({ description: 'Event visibility', enum: EventVisibility })
  @IsEnum(EventVisibility)
  @IsOptional()
  visibility?: EventVisibility;
}

export class EventFiltersDto {
  @ApiProperty({ description: 'Filter by calendar IDs' })
  @IsArray()
  @IsOptional()
  calendarIds?: string[];

  @ApiProperty({ description: 'Search term for event title/description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ description: 'Start date for filtering' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date for filtering' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Filter by visibility', enum: EventVisibility })
  @IsEnum(EventVisibility)
  @IsOptional()
  visibility?: EventVisibility;

  @ApiProperty({ description: 'Filter by all-day events' })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;
}

// Event Invite DTOs
export class CreateEventInviteDto {
  @ApiProperty({ description: 'Event ID' })
  @IsString()
  eventId: string;

  @ApiProperty({ description: 'Invitee email' })
  @IsString()
  email: string;
}

export class UpdateEventInviteDto {
  @ApiProperty({ description: 'Invite status', enum: InviteStatus })
  @IsEnum(InviteStatus)
  status: InviteStatus;
}

// Legacy DTOs for backward compatibility
export class CreateCalendarEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Event date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Start time' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'End time' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Event type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Event priority' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ description: 'Event location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Event attendees' })
  @IsArray()
  @IsOptional()
  attendees?: string[];

  @ApiProperty({ description: 'Whether this is an online meeting' })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({ description: 'Whether this is a recurring event' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({ description: 'Recurrence pattern' })
  @IsString()
  @IsOptional()
  recurrence?: string;

  @ApiProperty({ description: 'Reminder time in minutes' })
  @IsNumber()
  @IsOptional()
  reminder?: number;

  @ApiProperty({ description: 'Event color' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Event notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  @IsOptional()
  projectId?: string;
}

export class UpdateCalendarEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Event date' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ description: 'Start time' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'End time' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Event type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Event priority' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ description: 'Event location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Event attendees' })
  @IsArray()
  @IsOptional()
  attendees?: string[];

  @ApiProperty({ description: 'Whether this is an online meeting' })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({ description: 'Whether this is a recurring event' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({ description: 'Recurrence pattern' })
  @IsString()
  @IsOptional()
  recurrence?: string;

  @ApiProperty({ description: 'Reminder time in minutes' })
  @IsNumber()
  @IsOptional()
  reminder?: number;

  @ApiProperty({ description: 'Event color' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Whether event is completed' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiProperty({ description: 'Event notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  @IsOptional()
  projectId?: string;
}

export class CalendarEventFiltersDto {
  @ApiProperty({ description: 'Filter by event type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Filter by priority' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ description: 'Filter by project ID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ description: 'Filter by completion status' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiProperty({ description: 'Filter by start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'Filter by end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;
}
