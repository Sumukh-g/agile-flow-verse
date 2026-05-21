import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api.config';

export type RealtimeEvent = 
  | 'task.created' 
  | 'task.updated' 
  | 'task.deleted'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'note.created'
  | 'note.updated'
  | 'note.deleted'
  | 'notification.new';

export interface RealtimeMessage {
  event: RealtimeEvent;
  data: any;
  timestamp: string;
}

class RealtimeClient {
  private socket: Socket | null = null;
  private listeners: Map<RealtimeEvent, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  connect(token: string, tenantId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const wsUrl = API_CONFIG.baseURL.replace(/^https?:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
      
      this.socket = io(`${wsUrl}/realtime`, {
        auth: { token, tenantId },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[Realtime] Connected');
        resolve();
      });

      this.socket.on('reconnect', (attemptNumber: number) => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log(`[Realtime] Reconnected after ${attemptNumber} attempts`);
        // Emit custom reconnect event for handlers
        this.handleEvent('reconnect' as RealtimeEvent, { attemptNumber });
      });

      this.socket.on('connected', (data) => {
        console.log('[Realtime] Authenticated', data);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log('[Realtime] Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Realtime] Connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      // Listen for all real-time events
      this.socket.on('task.updated', (data) => this.handleEvent('task.updated', data));
      this.socket.on('task.created', (data) => this.handleEvent('task.created', data));
      this.socket.on('task.deleted', (data) => this.handleEvent('task.deleted', data));
      this.socket.on('project.updated', (data) => this.handleEvent('project.updated', data));
      this.socket.on('project.created', (data) => this.handleEvent('project.created', data));
      this.socket.on('project.deleted', (data) => this.handleEvent('project.deleted', data));
      this.socket.on('note.updated', (data) => this.handleEvent('note.updated', data));
      this.socket.on('note.created', (data) => this.handleEvent('note.created', data));
      this.socket.on('note.deleted', (data) => this.handleEvent('note.deleted', data));
      this.socket.on('notification.new', (data) => this.handleEvent('notification.new', data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  subscribe(channels: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('subscribe', { channels }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  unsubscribe(channels: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('unsubscribe', { channels }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  on(event: RealtimeEvent, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event: RealtimeEvent, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private handleEvent(event: RealtimeEvent, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Realtime] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const realtimeClient = new RealtimeClient();

