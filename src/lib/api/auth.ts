/**
 * Auth API Client
 */

import { apiClient } from '../api-client';
import { User } from './types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  email: string;
  password: string;
  name: string;
  tenantName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  /**
   * Login with email and password
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    return apiClient.post('/auth/login', data);
  },

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpDto): Promise<AuthResponse> {
    return apiClient.post('/auth/signup', data);
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get('/auth/profile');
  },
};

