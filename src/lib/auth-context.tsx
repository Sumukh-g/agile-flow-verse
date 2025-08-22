import React, { createContext, useContext, useEffect, useState } from 'react';
import { initKeycloak, keycloak } from './keycloak';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's a mock user in localStorage (for demo purposes)
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const mockUser = JSON.parse(savedUser);
          setUser({
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            roles: mockUser.roles || ['user'],
          });
          setLoading(false);
          return;
        }

        // Try to initialize Keycloak
        const authenticated = await initKeycloak();
        
        if (authenticated && keycloak.authenticated) {
          try {
            const userInfo = await keycloak.loadUserInfo() as any;
            setUser({
              id: keycloak.subject || '',
              email: userInfo.email || '',
              name: userInfo.name || userInfo.preferred_username || '',
              roles: keycloak.realmAccess?.roles || [],
            });
            
            // Store tenant ID if available
            if (userInfo.tenant_id) {
              localStorage.setItem('tenantId', userInfo.tenant_id);
            }
          } catch (error) {
            console.error('Failed to load user info:', error);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = () => {
    try {
      // Only try Keycloak login if it's properly configured
      if (keycloak && typeof keycloak.login === 'function') {
        keycloak.login();
      } else {
        throw new Error('Keycloak not properly initialized');
      }
    } catch (error) {
      console.error('Keycloak login failed:', error);
      // Fallback to demo login
      const mockUser = {
        id: Date.now().toString(),
        name: 'Demo User',
        email: 'demo@example.com',
        roles: ['user']
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('tenantId', 'dev');
      setUser(mockUser);
    }
  };

  const logout = () => {
    try {
      // Only try Keycloak logout if it's properly initialized
      if (keycloak.authenticated) {
        keycloak.logout();
      }
    } catch (error) {
      console.error('Keycloak logout failed:', error);
    }
    
    // Always clear local state regardless of Keycloak status
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 