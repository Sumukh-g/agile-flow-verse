import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaService } from '../common/kafka/kafka.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Outbox Relay Service
 * 
 * Implements the transactional outbox pattern for reliable event publishing.
 * Polls the outbox table for unprocessed events and relays them to Kafka.
 * 
 * Performance: Uses indexed query on (processed, createdAt) for fast lookups.
 */
@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);
  private consecutiveErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async relay() {
    try {
      // Query uses index on (processed, createdAt) for performance
      const batch = await this.prisma.outbox.findMany({
        where: { processed: false },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });

      // Reset error counter on successful query
      this.consecutiveErrors = 0;

      for (const evt of batch) {
        try {
          const payload = evt.payload as any;
          const topic = payload?.type || 'generic.event';
          await this.kafka.publish(topic, {
            ...payload,
            tenantId: evt.tenantId,
            outboxId: evt.id,
            createdAt: evt.createdAt,
          });
          await this.prisma.outbox.update({
            where: { id: evt.id },
            data: { processed: true },
          });
        } catch (e: any) {
          this.logger.error(`Failed to relay outbox ${evt.id}: ${e.message}`);
        }
      }
    } catch (error: any) {
      // Handle transient errors gracefully
      if (this.isTransientError(error)) {
        this.consecutiveErrors++;
        // Only log after first error, then periodically to avoid log spam
        if (this.consecutiveErrors === 1 || this.consecutiveErrors % this.MAX_CONSECUTIVE_ERRORS === 0) {
          this.logger.warn(
            `Database temporarily unavailable (attempt ${this.consecutiveErrors}). Will retry...`,
          );
        }
        return;
      }

      // Handle case where outbox table doesn't exist yet
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        return; // Silently skip - table will be created when migrations run
      }

      this.logger.error(`Error in outbox relay: ${error.message}`);
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
} 