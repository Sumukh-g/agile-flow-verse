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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
        this.userSockets = new Map(); // userId -> Set of socketIds
        this.socketUsers = new Map(); // socketId -> user info
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Connection rejected: No token provided`);
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            const userId = payload.sub || payload.userId;
            const tenantId = payload.tenantId || client.handshake.auth?.tenantId;
            if (!userId || !tenantId) {
                this.logger.warn(`Connection rejected: Invalid token payload`);
                client.disconnect();
                return;
            }
            // Verify user exists and has access to tenant
            const user = await this.prisma.user.findFirst({
                where: { id: userId, tenantId },
            });
            if (!user) {
                this.logger.warn(`Connection rejected: User not found`);
                client.disconnect();
                return;
            }
            client.userId = userId;
            client.tenantId = tenantId;
            // Track user socket
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(client.id);
            this.socketUsers.set(client.id, { userId, tenantId });
            // Join tenant room
            client.join(`tenant:${tenantId}`);
            // Join user room
            client.join(`user:${userId}`);
            this.logger.log(`Client connected: ${client.id} (User: ${userId}, Tenant: ${tenantId})`);
            // Send welcome message
            client.emit('connected', {
                userId,
                tenantId,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`Connection error: ${error?.message || String(error)}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userInfo = this.socketUsers.get(client.id);
        if (userInfo) {
            const sockets = this.userSockets.get(userInfo.userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(userInfo.userId);
                }
            }
            this.socketUsers.delete(client.id);
            this.logger.log(`Client disconnected: ${client.id} (User: ${userInfo.userId})`);
        }
    }
    handleSubscribe(client, data) {
        if (!client.userId || !client.tenantId) {
            return { error: 'Unauthorized' };
        }
        const { channels } = data;
        channels.forEach((channel) => {
            // Validate channel format
            if (channel.startsWith('project:') || channel.startsWith('task:') || channel.startsWith('note:')) {
                client.join(channel);
                this.logger.log(`Client ${client.id} subscribed to ${channel}`);
            }
        });
        return { success: true, subscribed: channels };
    }
    handleUnsubscribe(client, data) {
        if (!client.userId || !client.tenantId) {
            return { error: 'Unauthorized' };
        }
        const { channels } = data;
        channels.forEach((channel) => {
            client.leave(channel);
            this.logger.log(`Client ${client.id} unsubscribed from ${channel}`);
        });
        return { success: true, unsubscribed: channels };
    }
    // Broadcast methods called by services
    broadcastToTenant(tenantId, event, data) {
        this.server.to(`tenant:${tenantId}`).emit(event, data);
    }
    broadcastToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    broadcastToChannel(channel, event, data) {
        this.server.to(channel).emit(event, data);
    }
    broadcastToProject(tenantId, projectId, event, data) {
        this.server.to(`tenant:${tenantId}`).to(`project:${projectId}`).emit(event, data);
    }
    getConnectedUsers(tenantId) {
        const users = [];
        this.socketUsers.forEach((info, socketId) => {
            if (info.tenantId === tenantId && !users.includes(info.userId)) {
                users.push(info.userId);
            }
        });
        return users;
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribe", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
            credentials: true,
        },
        namespace: '/realtime',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], RealtimeGateway);
