import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { KafkaService } from '../common/kafka/kafka.service';

@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly kafka: KafkaService,
  ) {}

  async onModuleInit() {
    // Kafka is optional - real-time updates work via direct method calls
    this.logger.log('Realtime service initialized - using direct WebSocket broadcasts');
  }

  async onModuleDestroy() {
    // Cleanup if needed
  }

  private async handleEvent(topic: string, event: any) {
    const { tenantId, userId } = event;

    if (!tenantId) {
      this.logger.warn(`Event missing tenantId: ${topic}`);
      return;
    }

    // Route events to appropriate channels
    if (topic.startsWith('task.')) {
      this.handleTaskEvent(topic, event, tenantId);
    } else if (topic.startsWith('project.')) {
      this.handleProjectEvent(topic, event, tenantId);
    } else if (topic.startsWith('note.')) {
      this.handleNoteEvent(topic, event, tenantId);
    } else if (topic.startsWith('notification.')) {
      this.handleNotificationEvent(topic, event, tenantId, userId);
    }
  }

  private handleTaskEvent(topic: string, event: any, tenantId: string) {
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

  private handleProjectEvent(topic: string, event: any, tenantId: string) {
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

  private handleNoteEvent(topic: string, event: any, tenantId: string) {
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

  private handleNotificationEvent(topic: string, event: any, tenantId: string, userId?: string) {
    if (userId) {
      // Send to specific user
      this.gateway.broadcastToUser(userId, 'notification.new', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Broadcast to tenant
      this.gateway.broadcastToTenant(tenantId, 'notification.new', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Direct methods for services to call (when Kafka is not available or for immediate updates)
  async broadcastTaskUpdate(tenantId: string, projectId: string | null, taskId: string, event: string, data: any) {
    const payload = {
      taskId,
      projectId: projectId || undefined,
      event,
      data, // Include full task data for targeted cache updates
      timestamp: new Date().toISOString(),
    };

    // Broadcast to project channel if projectId exists
    if (projectId) {
      this.gateway.broadcastToProject(tenantId, projectId, event, payload);
    }

    // Always broadcast to task-specific channel
    this.gateway.broadcastToChannel(`task:${taskId}`, event, payload);

    // Also broadcast to tenant for general updates
    this.gateway.broadcastToTenant(tenantId, event, payload);
  }

  async broadcastProjectUpdate(tenantId: string, projectId: string, event: string, data: any) {
    const payload = {
      projectId,
      event,
      data, // Include full project data for targeted cache updates
      timestamp: new Date().toISOString(),
    };

    this.gateway.broadcastToChannel(`project:${projectId}`, event, payload);
    this.gateway.broadcastToTenant(tenantId, event, payload);
  }

  async broadcastNoteUpdate(tenantId: string, noteId: string, projectId: string, event: string, data: any) {
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
}

