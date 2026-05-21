import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel, NotificationPriority } from '../notifications/dto';

/**
 * Calendar Reminder Job
 * 
 * Scheduled job that sends notifications for upcoming calendar events.
 * Runs every minute to check for events with reminder settings.
 */
@Injectable()
export class CalendarReminderJob {
  private readonly logger = new Logger(CalendarReminderJob.name);
  private consecutiveErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Run every minute to check for calendar event reminders
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processReminders() {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // Find events where:
      // 1. reminderMinutesBefore is not null
      // 2. startAt - reminderMinutesBefore is within the last minute
      // 3. We haven't sent a reminder yet (tracked via a simple approach)
      
      // For now, we'll find events that should have reminders sent
      // In a production system, you'd track which reminders have been sent
      // Use prisma directly (not tx) since we're in a cron job without request context
      const eventsNeedingReminders = await this.prisma.calendarEvent.findMany({
        where: {
          reminderMinutesBefore: { not: null },
          startAt: {
            gte: now, // Event hasn't started yet
          },
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      }).catch((error: any) => {
        // Gracefully handle if table doesn't exist
        if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      });

      // Reset error counter on successful query
      this.consecutiveErrors = 0;

      for (const event of eventsNeedingReminders) {
        if (!event.reminderMinutesBefore) continue;

        const reminderTime = new Date(event.startAt.getTime() - event.reminderMinutesBefore * 60 * 1000);
        
        // Check if reminder time is within the last minute
        if (reminderTime >= oneMinuteAgo && reminderTime <= now) {
          await this.sendReminder(event);
        }
      }
    } catch (error: any) {
      // Handle transient database connection errors gracefully
      if (this.isTransientError(error)) {
        this.consecutiveErrors++;
        // Only log periodically to avoid log spam
        if (this.consecutiveErrors === 1 || this.consecutiveErrors % this.MAX_CONSECUTIVE_ERRORS === 0) {
          this.logger.warn(
            `Database temporarily unavailable (attempt ${this.consecutiveErrors}). Will retry...`,
          );
        }
        return;
      }

      this.logger.error(`Error processing calendar reminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Check if error is transient (connection issues, etc.)
   */
  private isTransientError(error: any): boolean {
    const message = error?.message || '';
    return (
      message.includes("Can't reach database server") ||
      message.includes('Connection refused') ||
      message.includes('ECONNREFUSED') ||
      message.includes('Connection timed out') ||
      message.includes('ETIMEDOUT') ||
      error?.code === 'P1001' || // Prisma: Can't reach database server
      error?.code === 'P1002' || // Prisma: The database server was reached but timed out
      error?.code === 'P1008' || // Prisma: Operations timed out
      error?.code === 'P1017'    // Prisma: Server has closed the connection
    );
  }

  /**
   * Send a reminder notification for a calendar event
   */
  private async sendReminder(event: any) {
    try {
      const minutesText = event.reminderMinutesBefore === 0 
        ? 'now' 
        : `${event.reminderMinutesBefore} minute${event.reminderMinutesBefore !== 1 ? 's' : ''}`;
      
      const message = event.allDay
        ? `${event.title} is ${minutesText === 'now' ? 'happening' : `in ${minutesText}`} (All Day)`
        : `${event.title} is ${minutesText === 'now' ? 'starting' : `starting in ${minutesText}`}`;

      await this.notifications.createNotification({
        tenantId: event.tenantId,
        userId: event.createdById,
        type: NotificationType.CALENDAR_REMINDER,
        title: 'Calendar Reminder',
        message,
        data: {
          eventId: event.id,
          eventTitle: event.title,
          startAt: event.startAt.toISOString(),
          allDay: event.allDay,
          projectId: event.projectId,
          projectName: event.project?.name,
        },
        channels: [NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
      });

      this.logger.log(`Sent reminder for event ${event.id} to user ${event.createdById}`);
    } catch (error: any) {
      this.logger.error(`Failed to send reminder for event ${event.id}: ${error.message}`);
    }
  }
}

