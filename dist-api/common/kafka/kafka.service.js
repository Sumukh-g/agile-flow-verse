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
let KafkaService = KafkaService_1 = class KafkaService {
    constructor() {
        this.logger = new common_1.Logger(KafkaService_1.name);
        this.connected = false;
    }
    async onModuleInit() {
        // In development, Kafka is optional
        if (process.env.KAFKA_BROKERS) {
            this.logger.log('Kafka configured but using mock for development');
        }
        else {
            this.logger.warn('Kafka not configured, events will be logged only');
        }
        this.connected = true;
    }
    async send(topic, message) {
        // In development, just log the event
        this.logger.debug(`[Kafka Mock] Topic: ${topic}, Message:`, message);
        return Promise.resolve();
    }
    async publish(topic, message) {
        // Alias for send() for compatibility
        return this.send(topic, message);
    }
    async subscribe(topic, callback) {
        this.logger.debug(`[Kafka Mock] Subscribed to topic: ${topic}`);
        return Promise.resolve();
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = KafkaService_1 = __decorate([
    (0, common_1.Injectable)()
], KafkaService);
