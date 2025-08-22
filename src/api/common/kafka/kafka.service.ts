import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, logLevel, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka?: Kafka;
  private producer?: Producer;

  async onModuleInit() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    this.kafka = new Kafka({
      clientId: 'agile-flow-verse',
      brokers,
      logLevel: logLevel.NOTHING,
    });
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer?.disconnect();
  }

  async publish(topic: string, message: any) {
    if (!this.producer) return;
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
} 