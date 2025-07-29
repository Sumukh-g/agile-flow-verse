import { Injectable } from '@nestjs/common';
import { OutboxService } from '../outbox/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimesheetDto } from './dto';

@Injectable()
export class TimesheetService {
  constructor(
    private prisma: PrismaService,
    private outboxService: OutboxService,
  ) {}

  async create(createTimesheetDto: CreateTimesheetDto) {
    // In a real app, get user and tenant from request context
    const userId = 'user-123';
    const tenantId = 'tenant-123';

    return this.prisma.$transaction(async (tx) => {
      const timesheet = await tx.timesheet.create({
        data: {
          ...createTimesheetDto,
          userId,
          tenantId,
          date: new Date(createTimesheetDto.date),
        },
        include: {
          task: true,
          user: true,
        },
      });

      // Add to outbox for Kafka publishing
      await this.outboxService.addToOutbox(tx, {
        aggregate: 'Timesheet',
        payload: {
          id: timesheet.id,
          taskId: timesheet.taskId,
          userId: timesheet.userId,
          tenantId: timesheet.tenantId,
          date: timesheet.date,
          hours: timesheet.hours,
          description: timesheet.description,
        },
        tenantId,
      });

      return timesheet;
    });
  }
} 