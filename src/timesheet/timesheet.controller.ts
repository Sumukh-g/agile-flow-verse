import { Body, Controller, Post } from '@nestjs/common';
import { CreateTimesheetDto } from './dto';
import { TimesheetService } from './timesheet.service';

@Controller('timesheets')
export class TimesheetController {
  constructor(private timesheetService: TimesheetService) {}

  @Post()
  async create(@Body() createTimesheetDto: CreateTimesheetDto) {
    return this.timesheetService.create(createTimesheetDto);
  }
} 