import { API_CONFIG } from '@/config/api.config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { offlineQueue } from './offline-queue';

export interface ApiError {
  traceId: string;
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  traceId: string;
}

class ApiClient {
  private client: AxiosInstance;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_CONFIG.baseURL}/v1`,
      timeout: API_CONFIG.timeout,
      withCredentials: API_CONFIG.withCredentials,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token from localStorage
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add required headers
        config.headers['X-Request-Id'] = uuidv4();
        
        // Tenant ID should come from JWT token, not headers
        // Only add if needed for backwards compatibility in development
        if (import.meta.env.DEV) {
          const tenantId = localStorage.getItem('tenantId');
          if (tenantId) {
            config.headers['X-Tenant-Id'] = tenantId;
          }
        }

        // Add idempotency key for mutations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
          config.headers['Idempotency-Key'] = uuidv4();
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const { response, config } = error;
        
        // Handle retryable errors
        if (response?.status && [502, 503, 504].includes(response.status) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.client.request(config);
        }
        
        this.retryCount = 0;
        
        // Handle API error envelope
        if (response?.data && response.data.code) {
          const apiError: ApiError = response.data;
          error.apiError = apiError;
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      // Queue for offline processing
      const requestId = offlineQueue.add({
        method: 'POST',
        url,
        data,
        headers: config?.headers as Record<string, string>,
      });
      throw new Error(`Offline: Request queued with ID ${requestId}`);
    }

    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      // If network error and it's a mutation, queue it
      if (!error.response) {
        const requestId = offlineQueue.add({
          method: 'POST',
          url,
          data,
          headers: config?.headers as Record<string, string>,
        });
        throw new Error(`Network error: Request queued with ID ${requestId}`);
      }
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      const requestId = offlineQueue.add({
        method: 'PUT',
        url,
        data,
        headers: config?.headers as Record<string, string>,
      });
      throw new Error(`Offline: Request queued with ID ${requestId}`);
    }

    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      if (!error.response) {
        const requestId = offlineQueue.add({
          method: 'PUT',
          url,
          data,
          headers: config?.headers as Record<string, string>,
        });
        throw new Error(`Network error: Request queued with ID ${requestId}`);
      }
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      const requestId = offlineQueue.add({
        method: 'PATCH',
        url,
        data,
        headers: config?.headers as Record<string, string>,
      });
      throw new Error(`Offline: Request queued with ID ${requestId}`);
    }

    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      if (!error.response) {
        const requestId = offlineQueue.add({
          method: 'PATCH',
          url,
          data,
          headers: config?.headers as Record<string, string>,
        });
        throw new Error(`Network error: Request queued with ID ${requestId}`);
      }
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      const requestId = offlineQueue.add({
        method: 'DELETE',
        url,
        headers: config?.headers as Record<string, string>,
      });
      throw new Error(`Offline: Request queued with ID ${requestId}`);
    }

    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error: any) {
      if (!error.response) {
        const requestId = offlineQueue.add({
          method: 'DELETE',
          url,
          headers: config?.headers as Record<string, string>,
        });
        throw new Error(`Network error: Request queued with ID ${requestId}`);
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient(); 