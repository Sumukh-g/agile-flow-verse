"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OutboxRelayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxRelayService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const kafka_service_1 = require("../common/kafka/kafka.service");
const prisma_service_1 = require("../prisma/prisma.service");
let OutboxRelayService = OutboxRelayService_1 = class OutboxRelayService {
    constructor(prisma, kafka) {
        this.prisma = prisma;
        this.kafka = kafka;
        this.logger = new common_1.Logger(OutboxRelayService_1.name);
    }
    async relay() {
        const batch = await this.prisma.outbox.findMany({
            where: { processed: false },
            take: 100,
            orderBy: { createdAt: 'asc' },
        });
        for (const evt of batch) {
            try {
                const payload = evt.payload;
                const topic = payload?.type || 'generic.event';
                await this.kafka.publish(topic, { ...payload, tenantId: evt.tenantId, outboxId: evt.id, createdAt: evt.createdAt });
                await this.prisma.outbox.update({ where: { id: evt.id }, data: { processed: true } });
            }
            catch (e) {
                this.logger.error(`Failed to relay outbox ${evt.id}: ${e}`);
            }
        }
    }
};
exports.OutboxRelayService = OutboxRelayService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxRelayService.prototype, "relay", null);
exports.OutboxRelayService = OutboxRelayService = OutboxRelayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, kafka_service_1.KafkaService])
], OutboxRelayService);
