import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { safeSetItem, safeGetItem, safeRemoveItem, clearAuthStorage } from './storage-utils';

interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = safeGetItem('accessToken');
        const savedUser = safeGetItem('user');
        
        if (accessToken && savedUser) {
          try {
            // Parse saved user
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            
            // Optionally verify token is still valid
            // await api.auth.getProfile();
          } catch (error) {
            console.error('Auth initialization error:', error);
            // Clear invalid session and cache
            queryClient.clear();
            clearAuthStorage();
          }
        } else {
          // No saved session - clear cache to be safe
          queryClient.clear();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Clear cache before login to prevent showing previous user's data
      queryClient.clear();
      
      const response = await api.auth.login({ email, password });
      
      // Store tokens and user with safe storage
      const success = 
        safeSetItem('accessToken', response.accessToken) &&
        safeSetItem('refreshToken', response.refreshToken) &&
        safeSetItem('user', JSON.stringify(response.user)) &&
        safeSetItem('tenantId', response.user.tenantId);
      
      if (!success) {
        throw new Error('Failed to store authentication data. Please clear your browser storage and try again.');
      }
      
      setUser(response.user);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear React Query cache to prevent data leakage between users
      queryClient.clear();
      
      // Clear local state
      clearAuthStorage();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
