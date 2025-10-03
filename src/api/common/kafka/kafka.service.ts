import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, logLevel, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka?: Kafka;
  private producer?: Producer;
  private isConnected = false;

  async onModuleInit() {
    try {
      const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
      this.kafka = new Kafka({
        clientId: 'agile-flow-verse',
        brokers,
        logLevel: logLevel.NOTHING,
        retry: {
          initialRetryTime: 100,
          retries: 3,
        },
      });
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to Kafka');
    } catch (error) {
      this.logger.warn('Failed to connect to Kafka, continuing without event publishing', error.message);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.producer && this.isConnected) {
      try {
        await this.producer.disconnect();
        this.logger.log('Disconnected from Kafka');
      } catch (error) {
        this.logger.error('Error disconnecting from Kafka', error.message);
      }
    }
  }

  async publish(topic: string, message: any) {
    if (!this.producer || !this.isConnected) {
      this.logger.debug('Kafka not available, skipping message publish', { topic });
      return;
    }
    
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.debug('Message published to Kafka', { topic });
    } catch (error) {
      this.logger.error('Failed to publish message to Kafka', { topic, error: error.message });
    }
  }
} 