import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly socketUsers = new Map<string, { userId: string; tenantId: string }>(); // socketId -> user info

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
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
      this.userSockets.get(userId)!.add(client.id);
      this.socketUsers.set(client.id, { userId, tenantId });

      // Join tenant room
      client.join(`tenant:${tenantId}`);
      // Join user room
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${userId}, Tenant: ${tenantId})`);

      // Broadcast user presence to tenant
      this.broadcastToTenant(tenantId, 'user.presence', {
        userId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });

      // Send welcome message
      client.emit('connected', {
        userId,
        tenantId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Connection error: ${error?.message || String(error)}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userInfo = this.socketUsers.get(client.id);
    if (userInfo) {
      const sockets = this.userSockets.get(userInfo.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userInfo.userId);
          
          // Broadcast user offline status only if all sockets disconnected
          this.broadcastToTenant(userInfo.tenantId, 'user.presence', {
            userId: userInfo.userId,
            status: 'offline',
            timestamp: new Date().toISOString(),
          });
        }
      }
      this.socketUsers.delete(client.id);
      this.logger.log(`Client disconnected: ${client.id} (User: ${userInfo.userId})`);
    }
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channels: string[] },
  ) {
    if (!client.userId || !client.tenantId) {
      return { error: 'Unauthorized' };
    }

    const { channels } = data;
    const subscribed: string[] = [];

    for (const channel of channels) {
      if (channel.startsWith('project:')) {
        const projectId = channel.split(':')[1];
        const member = await this.prisma.projectMember.findFirst({
          where: { projectId, userId: client.userId, tenantId: client.tenantId },
        });
        if (!member) continue;
      }

      if (channel.startsWith('project:') || channel.startsWith('task:') || channel.startsWith('note:')) {
        client.join(channel);
        subscribed.push(channel);
      }
    }

    return { success: true, subscribed };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channels: string[] },
  ) {
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
  broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastToChannel(channel: string, event: string, data: any) {
    this.server.to(channel).emit(event, data);
  }

  broadcastToProject(tenantId: string, projectId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).to(`project:${projectId}`).emit(event, data);
  }

  getConnectedUsers(tenantId: string): string[] {
    const users: string[] = [];
    this.socketUsers.forEach((info, socketId) => {
      if (info.tenantId === tenantId && !users.includes(info.userId)) {
        users.push(info.userId);
      }
    });
    return users;
  }
}

