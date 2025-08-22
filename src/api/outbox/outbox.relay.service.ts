import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaService } from '../common/kafka/kafka.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(private readonly prisma: PrismaService, private readonly kafka: KafkaService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async relay() {
    const batch = await this.prisma.outbox.findMany({
      where: { processed: false },
      take: 100,
      orderBy: { createdAt: 'asc' },
    });

    for (const evt of batch) {
      try {
        const payload = evt.payload as any;
        const topic = payload?.type || 'generic.event';
        await this.kafka.publish(topic, { ...payload, tenantId: evt.tenantId, outboxId: evt.id, createdAt: evt.createdAt });
        await this.prisma.outbox.update({ where: { id: evt.id }, data: { processed: true } });
      } catch (e) {
        this.logger.error(`Failed to relay outbox ${evt.id}: ${e}`);
      }
    }
  }
} 