import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalendarService } from './calendar.service';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get calendar events' })
  @ApiResponse({ status: 200, description: 'Calendar events retrieved successfully' })
  async getEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.calendarService.getCalendarEvents(
      req.user.tenantId,
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get('personal')
  @ApiOperation({ summary: 'Get personal calendar events' })
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
  @ApiOperation({ summary: 'Get all projects calendar events' })
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
  @ApiOperation({ summary: 'Get project calendar events' })
  @ApiResponse({ status: 200, description: 'Project calendar events retrieved successfully' })
  async getProjectEvents(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.calendarService.getProjectCalendar(
      req.user.tenantId,
      projectId,
      startDate,
      endDate,
    );
  }
}
