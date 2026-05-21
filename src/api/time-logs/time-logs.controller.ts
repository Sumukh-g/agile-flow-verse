import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { TimeLogsService } from './time-logs.service';
import {
  CreateTimeLogDto,
  CreateTimeLogDtoSchema,
  UpdateTimeLogDto,
  UpdateTimeLogDtoSchema,
  TimeLogQueryDto,
  TimeLogQueryDtoSchema,
  AuthenticatedRequest,
} from '../../shared/types';

@Controller('/v1/time-logs')
@UseGuards(JwtAuthGuard)
export class TimeLogsController {
  constructor(private readonly timeLogsService: TimeLogsService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateTimeLogDtoSchema)) dto: CreateTimeLogDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.timeLogsService.create(req.user.tenantId, req.user.userId, dto);
  }

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startTimer(
    @Request() req: AuthenticatedRequest,
    @Body('taskId') taskId: string,
    @Body('description') description?: string,
  ) {
    return this.timeLogsService.startTimer(req.user.tenantId, req.user.userId, taskId, description);
  }

  @Post('stop')
  async stopTimer(
    @Request() req: AuthenticatedRequest,
    @Body('description') description?: string,
  ) {
    return this.timeLogsService.stopTimer(req.user.tenantId, req.user.userId, description);
  }

  @Get('active')
  async getActiveTimer(@Request() req: AuthenticatedRequest) {
    return this.timeLogsService.getActiveTimer(req.user.tenantId, req.user.userId);
  }

  @Get()
  async list(
    @Query(new ZodValidationPipe(TimeLogQueryDtoSchema)) query: TimeLogQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.timeLogsService.list(req.user.tenantId, req.user.userId, query);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTimeLogDtoSchema)) dto: UpdateTimeLogDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.timeLogsService.update(req.user.tenantId, req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.timeLogsService.delete(req.user.tenantId, req.user.userId, id);
  }
}

