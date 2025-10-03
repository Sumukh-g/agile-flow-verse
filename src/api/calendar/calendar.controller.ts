import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Multer } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import {
  CreateCalendarDto,
  UpdateCalendarDto,
  CreateEventDto,
  UpdateEventDto,
  EventFiltersDto,
  CalendarFiltersDto,
} from './dto/index';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // Calendar endpoints
  @Get()
  @ApiOperation({ summary: 'Get user-accessible calendars' })
  @ApiResponse({ status: 200, description: 'Calendars retrieved successfully' })
  async getCalendars(@Query() filters: CalendarFiltersDto, @Request() req: any) {
    return this.calendarService.getCalendars(req.user.sub, req.user.tenantId, filters);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new calendar' })
  @ApiResponse({ status: 201, description: 'Calendar created successfully' })
  async createCalendar(@Body() createCalendarDto: CreateCalendarDto, @Request() req: any) {
    return this.calendarService.createCalendar(createCalendarDto, req.user.sub, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a calendar' })
  @ApiResponse({ status: 200, description: 'Calendar updated successfully' })
  async updateCalendar(
    @Param('id') id: string,
    @Body() updateCalendarDto: UpdateCalendarDto,
    @Request() req: any,
  ) {
    return this.calendarService.updateCalendar(id, updateCalendarDto, req.user.sub, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calendar' })
  @ApiResponse({ status: 200, description: 'Calendar deleted successfully' })
  async deleteCalendar(@Param('id') id: string, @Request() req: any) {
    return this.calendarService.deleteCalendar(id, req.user.sub, req.user.tenantId);
  }

  // Event endpoints
  @Get('events')
  @ApiOperation({ summary: 'Get events with filters' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(@Query() filters: EventFiltersDto, @Request() req: any) {
    return this.calendarService.getEvents(req.user.sub, req.user.tenantId, filters);
  }

  @Post('events')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req: any) {
    return this.calendarService.createEvent(createEventDto, req.user.sub, req.user.tenantId);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get a specific event' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  async getEvent(@Param('id') id: string, @Request() req: any) {
    return this.calendarService.getEvent(id, req.user.sub, req.user.tenantId);
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any,
  ) {
    return this.calendarService.updateEvent(id, updateEventDto, req.user.sub, req.user.tenantId);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  async deleteEvent(@Param('id') id: string, @Request() req: any) {
    return this.calendarService.deleteEvent(id, req.user.sub, req.user.tenantId);
  }

  // Import/Export endpoints
  @Post('events/import/ics')
  @ApiOperation({ summary: 'Import events from ICS file' })
  @ApiResponse({ status: 201, description: 'Events imported successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async importICS(@UploadedFile() file: Multer.File, @Request() req: any) {
    return this.calendarService.importICS(file, req.user.sub, req.user.tenantId);
  }

  @Get('events/export/ics')
  @ApiOperation({ summary: 'Export events to ICS file' })
  @ApiResponse({ status: 200, description: 'ICS file generated successfully' })
  async exportICS(
    @Query('calendarId') calendarId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const icsContent = await this.calendarService.exportICS(
      { calendarId, startDate, endDate },
      req.user.sub,
      req.user.tenantId,
    );
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    res.send(icsContent);
  }

  @Get('events/export/csv')
  @ApiOperation({ summary: 'Export events to CSV file' })
  @ApiResponse({ status: 200, description: 'CSV file generated successfully' })
  async exportCSV(
    @Query('calendarId') calendarId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const csvContent = await this.calendarService.exportCSV(
      { calendarId, startDate, endDate },
      req.user.sub,
      req.user.tenantId,
    );
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.csv"');
    res.send(csvContent);
  }

  // AI endpoints
  @Post('ai/extract-events')
  @ApiOperation({ summary: 'Extract events from text using AI' })
  @ApiResponse({ status: 200, description: 'Events extracted successfully' })
  async extractEvents(@Body() data: { text: string; noteId?: string }, @Request() req: any) {
    return this.calendarService.extractEvents(data, req.user.sub, req.user.tenantId);
  }

  @Post('ai/auto-schedule')
  @ApiOperation({ summary: 'Auto-schedule events using AI' })
  @ApiResponse({ status: 200, description: 'Schedule optimized successfully' })
  async autoSchedule(@Body() data: { events: any[]; constraints: any }, @Request() req: any) {
    return this.calendarService.autoSchedule(data, req.user.sub, req.user.tenantId);
  }

  @Post('ai/weekly-summary')
  @ApiOperation({ summary: 'Generate weekly summary using AI' })
  @ApiResponse({ status: 200, description: 'Weekly summary generated successfully' })
  async weeklySummary(@Body() data: { startDate: string; endDate: string }, @Request() req: any) {
    return this.calendarService.weeklySummary(data, req.user.sub, req.user.tenantId);
  }

  // Integration endpoints
  @Post('integrations/google/connect')
  @ApiOperation({ summary: 'Connect Google Calendar' })
  @ApiResponse({ status: 200, description: 'Google Calendar connected successfully' })
  async connectGoogle(@Request() req: any) {
    return this.calendarService.connectGoogle(req.user.sub, req.user.tenantId);
  }

  @Post('integrations/outlook/connect')
  @ApiOperation({ summary: 'Connect Outlook Calendar' })
  @ApiResponse({ status: 200, description: 'Outlook Calendar connected successfully' })
  async connectOutlook(@Request() req: any) {
    return this.calendarService.connectOutlook(req.user.sub, req.user.tenantId);
  }

  @Post('integrations/sync')
  @ApiOperation({ summary: 'Sync with external calendars' })
  @ApiResponse({ status: 200, description: 'Calendar synced successfully' })
  async syncCalendars(@Request() req: any) {
    return this.calendarService.syncCalendars(req.user.sub, req.user.tenantId);
  }
}
