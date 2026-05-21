/**
 * Offline request queue for handling requests when offline
 * Automatically syncs when connection is restored
 */

export interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

/** Never persist login/signup/refresh — they are not safe to replay from storage. */
function isCredentialAuthUrl(url: string): boolean {
  const u = url || '';
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/signup') ||
    u.includes('/auth/refresh')
  );
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isOnline = navigator.onLine;
  private isProcessing = false;
  private storageKey = 'offline-queue';

  constructor() {
    this.loadFromStorage();
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed: QueuedRequest[] = JSON.parse(stored);
        const filtered = Array.isArray(parsed)
          ? parsed.filter((req) => !isCredentialAuthUrl(req.url))
          : [];
        this.queue = filtered;
        if (Array.isArray(parsed) && filtered.length !== parsed.length) {
          this.saveToStorage();
        }
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save to storage:', error);
    }
  }

  add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): string {
    if (isCredentialAuthUrl(request.url)) {
      console.warn('[OfflineQueue] Skipping queue for credential auth URL:', request.url);
      return `skip-${Date.now()}`;
    }
    const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: request.maxRetries || 3,
    };

    this.queue.push(queuedRequest);
    this.saveToStorage();

    // Try to process immediately if online
    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }

    return id;
  }

  remove(id: string) {
    this.queue = this.queue.filter(req => req.id !== id);
    this.saveToStorage();
  }

  async processQueue(): Promise<void> {
    if (!this.isOnline || this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const requests = [...this.queue];
      
      for (const request of requests) {
        try {
          await this.executeRequest(request);
          this.remove(request.id);
        } catch (error) {
          request.retries++;
          
          if (request.retries >= request.maxRetries) {
            console.error(`[OfflineQueue] Max retries reached for request ${request.id}`);
            this.remove(request.id);
            // Could emit event here for user notification
          } else {
            // Exponential backoff
            const delay = Math.pow(2, request.retries) * 1000;
            setTimeout(() => {
              this.processQueue();
            }, delay);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      this.saveToStorage();
    }
  }

  private async executeRequest(request: QueuedRequest): Promise<void> {
    const { apiClient } = await import('@/lib/api-client');
    
    const config: any = {
      method: request.method,
      url: request.url,
      headers: request.headers,
    };

    if (request.data && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      config.data = request.data;
    }

    switch (request.method) {
      case 'GET':
        await apiClient.get(request.url, config);
        break;
      case 'POST':
        await apiClient.post(request.url, request.data, config);
        break;
      case 'PUT':
        await apiClient.put(request.url, request.data, config);
        break;
      case 'PATCH':
        await apiClient.patch(request.url, request.data, config);
        break;
      case 'DELETE':
        await apiClient.delete(request.url, config);
        break;
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.saveToStorage();
  }

  get size(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();

