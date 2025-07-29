import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(private outboxService: OutboxService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutbox() {
    try {
      const unprocessedEvents = await this.outboxService.getUnprocessedEvents();

      for (const event of unprocessedEvents) {
        await this.publishToKafka(event);
        await this.outboxService.markAsProcessed(event.id);
        
        this.logger.log(`Published event ${event.id} to Kafka`);
      }
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
    }
  }

  private async publishToKafka(event: any) {
    // In a real implementation, this would use a Kafka client
    // For now, we'll just log the event
    this.logger.log(`Publishing to Kafka: ${event.aggregate}.recorded`, {
      payload: event.payload,
      tenantId: event.tenantId,
    });
  }
} 