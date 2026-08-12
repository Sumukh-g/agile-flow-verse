import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Request, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { CalendarService } from './calendar.service';
import { CalendarEventQueryDto, CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  /**
   * List calendar events with filtering
   * GET /v1/calendar/events
   */
  @Get('events')
  @ApiOperation({ summary: 'List calendar events with filtering' })
  @ApiResponse({ status: 200, description: 'Calendar events retrieved successfully' })
  async listEvents(
    @Query() query: CalendarEventQueryDto,
    @Request() req: any,
  ) {
    return this.calendarService.listEvents(
      req.user.tenantId,
      req.user.userId,
      query,
    );
  }

  /**
   * Get a single calendar event by ID
   * GET /v1/calendar/events/:id
   */
  @Get('events/:id')
  @ApiOperation({ summary: 'Get a calendar event by ID' })
  @ApiResponse({ status: 200, description: 'Calendar event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Calendar event not found' })
  async getEvent(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.calendarService.getEvent(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  /**
   * Create a new calendar event
   * POST /v1/calendar/events
   */
  @Post('events')
  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiResponse({ status: 201, description: 'Calendar event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createEvent(
    @Body() data: CreateCalendarEventDto,
    @Request() req: any,
  ) {
    return this.calendarService.createEvent(
      req.user.tenantId,
      req.user.userId,
      data,
    );
  }

  /**
   * Update a calendar event
   * PATCH /v1/calendar/events/:id
   */
  @Patch('events/:id')
  @ApiOperation({ summary: 'Update a calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event updated successfully' })
  @ApiResponse({ status: 404, description: 'Calendar event not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateEvent(
    @Param('id') id: string,
    @Body() data: UpdateCalendarEventDto,
    @Request() req: any,
  ) {
    return this.calendarService.updateEvent(
      req.user.tenantId,
      req.user.userId,
      id,
      data,
    );
  }

  /**
   * Delete a calendar event
   * DELETE /v1/calendar/events/:id
   */
  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Calendar event not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteEvent(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.calendarService.deleteEvent(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  // Legacy endpoints for backward compatibility
  @Get('personal')
  @ApiOperation({ summary: 'Get personal calendar events (legacy)' })
  @ApiResponse({ status: 200, description: 'Personal calendar events retrieved successfully' })
  async getPersonalEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.calendarService.getPersonalCalendar(
      req.user.tenantId,
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get all projects calendar events (legacy)' })
  @ApiResponse({ status: 200, description: 'All projects calendar events retrieved successfully' })
  async getAllProjectsEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.calendarService.getAllProjectsCalendar(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get project calendar events (legacy)' })
  @ApiResponse({ status: 200, description: 'Project calendar events retrieved successfully' })
  async getProjectEvents(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    await this.permissions.ensureCanReadProject(req.user.tenantId, req.user.userId, projectId);
    return this.calendarService.getProjectCalendar(
      req.user.tenantId,
      projectId,
      startDate,
      endDate,
    );
  }
}
