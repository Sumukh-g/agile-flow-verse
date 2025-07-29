import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface OutboxEvent {
  aggregate: string;
  payload: any;
  tenantId: string;
}

@Injectable()
export class OutboxService {
  constructor(private prisma: PrismaService) {}

  async addToOutbox(tx: any, event: OutboxEvent) {
    return tx.outbox.create({
      data: {
        aggregate: event.aggregate,
        payload: event.payload,
        tenantId: event.tenantId,
      },
    });
  }

  async getUnprocessedEvents() {
    return this.prisma.outbox.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsProcessed(id: string) {
    return this.prisma.outbox.update({
      where: { id },
      data: { processed: true },
    });
  }
} 