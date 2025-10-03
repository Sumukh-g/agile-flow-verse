"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventFiltersDto = exports.UpdateCalendarEventDto = exports.CreateCalendarEventDto = exports.UpdateEventInviteDto = exports.CreateEventInviteDto = exports.EventFiltersDto = exports.UpdateEventDto = exports.CreateEventDto = exports.CalendarFiltersDto = exports.UpdateCalendarDto = exports.CreateCalendarDto = exports.InviteStatus = exports.EventVisibility = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var EventVisibility;
(function (EventVisibility) {
    EventVisibility["DEFAULT"] = "default";
    EventVisibility["PRIVATE"] = "private";
    EventVisibility["PUBLIC"] = "public";
})(EventVisibility || (exports.EventVisibility = EventVisibility = {}));
var InviteStatus;
(function (InviteStatus) {
    InviteStatus["PENDING"] = "pending";
    InviteStatus["ACCEPTED"] = "accepted";
    InviteStatus["DECLINED"] = "declined";
})(InviteStatus || (exports.InviteStatus = InviteStatus = {}));
// Calendar DTOs
class CreateCalendarDto {
}
exports.CreateCalendarDto = CreateCalendarDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calendar name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calendar color', default: '#3b82f6' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is the default calendar', default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCalendarDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this calendar is shared', default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCalendarDto.prototype, "isShared", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Section ID for organization' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarDto.prototype, "sectionId", void 0);
class UpdateCalendarDto {
}
exports.UpdateCalendarDto = UpdateCalendarDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calendar name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calendar color' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is the default calendar' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateCalendarDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this calendar is shared' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateCalendarDto.prototype, "isShared", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Section ID for organization' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarDto.prototype, "sectionId", void 0);
class CalendarFiltersDto {
}
exports.CalendarFiltersDto = CalendarFiltersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by section ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarFiltersDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by owner user ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarFiltersDto.prototype, "ownerUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by shared status' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CalendarFiltersDto.prototype, "isShared", void 0);
// Event DTOs
class CreateEventDto {
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calendar ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "calendarId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event location' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is an all-day event', default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "allDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event start date/time' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "startAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event end date/time' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "endAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'RRULE string for recurring events' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "rrule", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Exception dates for recurring events' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "exDates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event timezone', default: 'UTC' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "timeZone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reminder settings' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "reminders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Attendee information' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "attendees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event visibility', enum: EventVisibility, default: EventVisibility.DEFAULT }),
    (0, class_validator_1.IsEnum)(EventVisibility),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "visibility", void 0);
class UpdateEventDto {
}
exports.UpdateEventDto = UpdateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calendar ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "calendarId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event location' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is an all-day event' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateEventDto.prototype, "allDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event start date/time' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "startAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event end date/time' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "endAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'RRULE string for recurring events' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "rrule", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Exception dates for recurring events' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "exDates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event timezone' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "timeZone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reminder settings' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateEventDto.prototype, "reminders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Attendee information' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateEventDto.prototype, "attendees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event visibility', enum: EventVisibility }),
    (0, class_validator_1.IsEnum)(EventVisibility),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "visibility", void 0);
class EventFiltersDto {
}
exports.EventFiltersDto = EventFiltersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by calendar IDs' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], EventFiltersDto.prototype, "calendarIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search term for event title/description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EventFiltersDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date for filtering' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EventFiltersDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End date for filtering' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EventFiltersDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by visibility', enum: EventVisibility }),
    (0, class_validator_1.IsEnum)(EventVisibility),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EventFiltersDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by all-day events' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], EventFiltersDto.prototype, "allDay", void 0);
// Event Invite DTOs
class CreateEventInviteDto {
}
exports.CreateEventInviteDto = CreateEventInviteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventInviteDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Invitee email' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventInviteDto.prototype, "email", void 0);
class UpdateEventInviteDto {
}
exports.UpdateEventInviteDto = UpdateEventInviteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Invite status', enum: InviteStatus }),
    (0, class_validator_1.IsEnum)(InviteStatus),
    __metadata("design:type", String)
], UpdateEventInviteDto.prototype, "status", void 0);
// Legacy DTOs for backward compatibility
class CreateCalendarEventDto {
}
exports.CreateCalendarEventDto = CreateCalendarEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event date' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start time' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End time' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event priority' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event location' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event attendees' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCalendarEventDto.prototype, "attendees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is an online meeting' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCalendarEventDto.prototype, "isOnline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is a recurring event' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCalendarEventDto.prototype, "isRecurring", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recurrence pattern' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "recurrence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reminder time in minutes' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCalendarEventDto.prototype, "reminder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event color' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Project ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "projectId", void 0);
class UpdateCalendarEventDto {
}
exports.UpdateCalendarEventDto = UpdateCalendarEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event date' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start time' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End time' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event type' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event priority' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event location' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event attendees' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateCalendarEventDto.prototype, "attendees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is an online meeting' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateCalendarEventDto.prototype, "isOnline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is a recurring event' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateCalendarEventDto.prototype, "isRecurring", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recurrence pattern' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "recurrence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reminder time in minutes' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateCalendarEventDto.prototype, "reminder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event color' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether event is completed' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateCalendarEventDto.prototype, "completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Project ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "projectId", void 0);
class CalendarEventFiltersDto {
}
exports.CalendarEventFiltersDto = CalendarEventFiltersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by event type' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarEventFiltersDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by priority' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarEventFiltersDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by project ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarEventFiltersDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by completion status' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CalendarEventFiltersDto.prototype, "completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by start date' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarEventFiltersDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by end date' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarEventFiltersDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search term' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CalendarEventFiltersDto.prototype, "search", void 0);
