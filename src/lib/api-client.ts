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
        
        // IMPORTANT: Tenant ID is derived from the JWT; do not send X-Tenant-Id
        // This prevents mismatches between header and token tenant context

        // Add idempotency key for mutations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
          config.headers['Idempotency-Key'] = uuidv4();
        }

        // For FormData, don't set Content-Type - let browser set it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
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
        
        // Handle 401 Unauthorized - clear tokens and redirect to login
        if (response?.status === 401) {
          console.error('401 Unauthorized - clearing tokens and redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('tenantId');
          
          // Only redirect if not already on login page and not a login request
          if (!window.location.pathname.includes('/login') && !config.url?.includes('/auth/login')) {
            window.location.href = '/login';
          }
        }
        
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