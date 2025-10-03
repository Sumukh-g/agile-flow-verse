import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KafkaService } from '../common/kafka/kafka.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(private readonly prisma: PrismaService, private readonly kafka: KafkaService) {}

  @Cron('*/10 * * * * *') // Every 10 seconds
  async relay() {
    try {
      // Check if prisma client is available
      if (!this.prisma || !this.prisma.outbox) {
        this.logger.warn('Prisma client not ready, skipping outbox relay');
        return;
      }

      const batch = await this.prisma.outbox.findMany({
        where: { processed: false },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });

      if (batch.length === 0) {
        return; // No pending events
      }

      this.logger.debug(`Processing ${batch.length} outbox events`);

      for (const evt of batch) {
        try {
          const payload = evt.payload as any;
          const topic = payload?.type || 'generic.event';
          await this.kafka.publish(topic, { ...payload, tenantId: evt.tenantId, outboxId: evt.id, createdAt: evt.createdAt });
          await this.prisma.outbox.update({ where: { id: evt.id }, data: { processed: true } });
          this.logger.debug(`Successfully processed outbox event ${evt.id}`);
        } catch (e) {
          this.logger.error(`Failed to relay outbox ${evt.id}: ${e.message}`);
        }
      }
    } catch (error) {
      this.logger.error('Error in outbox relay service', error.message);
    }
  }
} 