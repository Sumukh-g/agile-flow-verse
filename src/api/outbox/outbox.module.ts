import { Module } from '@nestjs/common';
import { KafkaModule } from '../common/kafka/kafka.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboxRelayService } from './outbox.relay.service';

@Module({
  imports: [PrismaModule, KafkaModule],
  providers: [OutboxRelayService],
})
export class OutboxModule {} 