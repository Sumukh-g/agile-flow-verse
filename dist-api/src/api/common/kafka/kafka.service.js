"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KafkaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
let KafkaService = KafkaService_1 = class KafkaService {
    constructor() {
        this.logger = new common_1.Logger(KafkaService_1.name);
        this.isConnected = false;
    }
    async onModuleInit() {
        try {
            const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
            this.kafka = new kafkajs_1.Kafka({
                clientId: 'agile-flow-verse',
                brokers,
                logLevel: kafkajs_1.logLevel.NOTHING,
                retry: {
                    initialRetryTime: 100,
                    retries: 3,
                },
            });
            this.producer = this.kafka.producer();
            await this.producer.connect();
            this.isConnected = true;
            this.logger.log('Successfully connected to Kafka');
        }
        catch (error) {
            this.logger.warn('Failed to connect to Kafka, continuing without event publishing', error.message);
            this.isConnected = false;
        }
    }
    async onModuleDestroy() {
        if (this.producer && this.isConnected) {
            try {
                await this.producer.disconnect();
                this.logger.log('Disconnected from Kafka');
            }
            catch (error) {
                this.logger.error('Error disconnecting from Kafka', error.message);
            }
        }
    }
    async publish(topic, message) {
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
        }
        catch (error) {
            this.logger.error('Failed to publish message to Kafka', { topic, error: error.message });
        }
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = KafkaService_1 = __decorate([
    (0, common_1.Injectable)()
], KafkaService);
