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
var RealtimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const realtime_gateway_1 = require("./realtime.gateway");
const kafka_service_1 = require("../common/kafka/kafka.service");
let RealtimeService = RealtimeService_1 = class RealtimeService {
    constructor(gateway, kafka) {
        this.gateway = gateway;
        this.kafka = kafka;
        this.logger = new common_1.Logger(RealtimeService_1.name);
    }
    async onModuleInit() {
        // Kafka is optional - real-time updates work via direct method calls
        this.logger.log('Realtime service initialized - using direct WebSocket broadcasts');
    }
    async onModuleDestroy() {
        // Cleanup if needed
    }
    async handleEvent(topic, event) {
        const { tenantId, userId } = event;
        if (!tenantId) {
            this.logger.warn(`Event missing tenantId: ${topic}`);
            return;
        }
        // Route events to appropriate channels
        if (topic.startsWith('task.')) {
            this.handleTaskEvent(topic, event, tenantId);
        }
        else if (topic.startsWith('project.')) {
            this.handleProjectEvent(topic, event, tenantId);
        }
        else if (topic.startsWith('note.')) {
            this.handleNoteEvent(topic, event, tenantId);
        }
        else if (topic.startsWith('notification.')) {
            this.handleNotificationEvent(topic, event, tenantId, userId);
        }
    }
    handleTaskEvent(topic, event, tenantId) {
        const { taskId, projectId } = event;
        // Broadcast to tenant and project channel
        this.gateway.broadcastToProject(tenantId, projectId, 'task.updated', {
            taskId,
            projectId,
            event: topic,
            timestamp: new Date().toISOString(),
        });
        // Also broadcast to specific task channel
        if (taskId) {
            this.gateway.broadcastToChannel(`task:${taskId}`, 'task.updated', {
                taskId,
                event: topic,
                timestamp: new Date().toISOString(),
            });
        }
    }
    handleProjectEvent(topic, event, tenantId) {
        const { projectId } = event;
        if (projectId) {
            this.gateway.broadcastToChannel(`project:${projectId}`, 'project.updated', {
                projectId,
                event: topic,
                timestamp: new Date().toISOString(),
            });
        }
        // Also broadcast to tenant
        this.gateway.broadcastToTenant(tenantId, 'project.updated', {
            projectId,
            event: topic,
            timestamp: new Date().toISOString(),
        });
    }
    handleNoteEvent(topic, event, tenantId) {
        const { noteId, projectId } = event;
        if (noteId) {
            this.gateway.broadcastToChannel(`note:${noteId}`, 'note.updated', {
                noteId,
                projectId,
                event: topic,
                timestamp: new Date().toISOString(),
            });
        }
        if (projectId) {
            this.gateway.broadcastToProject(tenantId, projectId, 'note.updated', {
                noteId,
                projectId,
                event: topic,
                timestamp: new Date().toISOString(),
            });
        }
    }
    handleNotificationEvent(topic, event, tenantId, userId) {
        if (userId) {
            // Send to specific user
            this.gateway.broadcastToUser(userId, 'notification.new', {
                ...event,
                timestamp: new Date().toISOString(),
            });
        }
        else {
            // Broadcast to tenant
            this.gateway.broadcastToTenant(tenantId, 'notification.new', {
                ...event,
                timestamp: new Date().toISOString(),
            });
        }
    }
    // Direct methods for services to call (when Kafka is not available or for immediate updates)
    async broadcastTaskUpdate(tenantId, projectId, taskId, event, data) {
        this.gateway.broadcastToProject(tenantId, projectId, 'task.updated', {
            taskId,
            projectId,
            event,
            data,
            timestamp: new Date().toISOString(),
        });
    }
    async broadcastProjectUpdate(tenantId, projectId, event, data) {
        this.gateway.broadcastToChannel(`project:${projectId}`, 'project.updated', {
            projectId,
            event,
            data,
            timestamp: new Date().toISOString(),
        });
        this.gateway.broadcastToTenant(tenantId, 'project.updated', {
            projectId,
            event,
            data,
            timestamp: new Date().toISOString(),
        });
    }
    async broadcastNoteUpdate(tenantId, noteId, projectId, event, data) {
        this.gateway.broadcastToChannel(`note:${noteId}`, 'note.updated', {
            noteId,
            projectId,
            event,
            data,
            timestamp: new Date().toISOString(),
        });
        if (projectId) {
            this.gateway.broadcastToProject(tenantId, projectId, 'note.updated', {
                noteId,
                projectId,
                event,
                data,
                timestamp: new Date().toISOString(),
            });
        }
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = RealtimeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway,
        kafka_service_1.KafkaService])
], RealtimeService);
