import { API_CONFIG } from '@/config/api.config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { offlineQueue } from './offline-queue';
import { safeGetItem } from './storage-utils';

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

/** Login/signup/refresh must never be queued offline — wrong credentials are not fixed by retries. */
function isCredentialAuthUrl(url: string): boolean {
  const u = url || '';
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/signup') ||
    u.includes('/auth/refresh')
  );
}

function extractLocalhostPort(baseUrlWithV1: string): number | null {
  const m = baseUrlWithV1.match(/^http:\/\/localhost:(\d+)\/v1$/i);
  if (!m) return null;
  return Number(m[1]);
}

class ApiClient {
  private client: AxiosInstance;
  private retryCount = 0;
  private maxRetries = 3;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: `${API_CONFIG.baseURL}/v1`,
      timeout: API_CONFIG.timeout,
      withCredentials: API_CONFIG.withCredentials,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - adds auth tokens and headers to all requests
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token from localStorage
        const token = safeGetItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Log warning for protected routes that require authentication
          // This helps debug why requests are failing with 401 errors
          const protectedRoutes = ['/projects', '/tasks', '/dashboard', '/crm', '/forms', '/issues'];
          const isProtectedRoute = protectedRoutes.some(route => config.url?.includes(route));
          
          if (isProtectedRoute && !config.url?.includes('/auth')) {
            console.warn(`[API Client] Making request to protected route ${config.url} without auth token. This will likely result in a 401 error.`);
          }
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
        
        // Handle 401 Unauthorized — try silent token refresh first, then redirect
        if (response?.status === 401 && !config?._retry) {
          // Skip refresh attempts for auth endpoints themselves
          if (config?.url?.includes('/auth/')) {
            this.clearAuthAndRedirect();
            return Promise.reject(error);
          }

          // If already refreshing, queue this request until new token arrives
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                config.headers.Authorization = `Bearer ${token}`;
                resolve(this.client.request(config));
              });
            });
          }

          config._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const res = await this.client.post('/auth/refresh', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken, user } = res.data;

            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            if (user) localStorage.setItem('user', JSON.stringify(user));

            // Update header for current request
            config.headers.Authorization = `Bearer ${accessToken}`;
            // Notify all queued requests
            this.refreshSubscribers.forEach((cb) => cb(accessToken));
            this.refreshSubscribers = [];

            return this.client.request(config);
          } catch {
            this.refreshSubscribers = [];
            this.clearAuthAndRedirect();
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
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

  private clearAuthAndRedirect() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  /**
   * In dev, backend may auto-shift ports (3000 -> 3001+). Detect and switch once.
   */
  private async trySwitchToReachableDevApi(): Promise<boolean> {
    if (import.meta.env.PROD) return false;
    const current = this.client.defaults.baseURL || `${API_CONFIG.baseURL}/v1`;
    const currentPort = extractLocalhostPort(current);
    if (!currentPort) return false;

    const candidatePorts = [currentPort, ...Array.from({ length: 10 }, (_, i) => 3000 + i)];
    const uniquePorts = Array.from(new Set(candidatePorts));

    for (const port of uniquePorts) {
      const candidateBase = `http://localhost:${port}`;
      const candidateV1 = `${candidateBase}/v1`;
      if (candidateV1 === current) continue;
      try {
        await axios.get(`${candidateV1}/health`, { timeout: 1500, withCredentials: false });
        this.client.defaults.baseURL = candidateV1;
        console.warn(
          `[API Client] Switched API base URL from ${current} to ${candidateV1} after connectivity failure.`,
        );
        return true;
      } catch {
        // try next port
      }
    }
    return false;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error: any) {
      if (!error?.response && navigator.onLine && (await this.trySwitchToReachableDevApi())) {
        const retry = await this.client.get<T>(url, config);
        return retry.data;
      }
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      if (isCredentialAuthUrl(url)) {
        throw new Error('You must be online to sign in or create an account.');
      }
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
      if (!error.response) {
        if (navigator.onLine && (await this.trySwitchToReachableDevApi())) {
          const retry = await this.client.post<T>(url, data, config);
          return retry.data;
        }
        if (isCredentialAuthUrl(url)) {
          const base = this.client.defaults.baseURL || `${API_CONFIG.baseURL}/v1`;
          throw new Error(
            `Cannot reach the API at ${base}. Check that the server is running and VITE_API_URL matches the active backend port.`,
          );
        }
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
        if (navigator.onLine && (await this.trySwitchToReachableDevApi())) {
          const retry = await this.client.put<T>(url, data, config);
          return retry.data;
        }
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
      if (isCredentialAuthUrl(url)) {
        throw new Error('You must be online to complete this request.');
      }
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
        if (navigator.onLine && (await this.trySwitchToReachableDevApi())) {
          const retry = await this.client.patch<T>(url, data, config);
          return retry.data;
        }
        if (isCredentialAuthUrl(url)) {
          const base = this.client.defaults.baseURL || `${API_CONFIG.baseURL}/v1`;
          throw new Error(
            `Cannot reach the API at ${base}. Check that the server is running and VITE_API_URL matches the port.`,
          );
        }
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
      if (isCredentialAuthUrl(url)) {
        throw new Error('You must be online to complete this request.');
      }
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
        if (navigator.onLine && (await this.trySwitchToReachableDevApi())) {
          const retry = await this.client.delete<T>(url, config);
          return retry.data;
        }
        if (isCredentialAuthUrl(url)) {
          const base = this.client.defaults.baseURL || `${API_CONFIG.baseURL}/v1`;
          throw new Error(
            `Cannot reach the API at ${base}. Check that the server is running and VITE_API_URL matches the port.`,
          );
        }
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