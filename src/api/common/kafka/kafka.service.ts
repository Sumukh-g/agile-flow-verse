import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private connected = false;

  async onModuleInit() {
    // In development, Kafka is optional
    if (process.env.KAFKA_BROKERS) {
      this.logger.log('Kafka configured but using mock for development');
    } else {
      this.logger.warn('Kafka not configured, events will be logged only');
    }
    this.connected = true;
  }

  async send(topic: string, message: any): Promise<void> {
    // In development, just log the event
    this.logger.debug(`[Kafka Mock] Topic: ${topic}, Message:`, message);
    return Promise.resolve();
  }

  async publish(topic: string, message: any): Promise<void> {
    // Alias for send() for compatibility
    return this.send(topic, message);
  }

  async subscribe(topic: string, callback: (message: any) => void): Promise<void> {
    this.logger.debug(`[Kafka Mock] Subscribed to topic: ${topic}`);
    return Promise.resolve();
  }
}
