import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import BoardsPage from "@/pages/Boards";
import CustomDashboard from "@/pages/CustomDashboard";
import Dashboard from "@/pages/Dashboard";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";
import Notes from "@/pages/Notes";
import NotificationsCenter from "@/pages/NotificationsCenter";
import PagesDirectory from "@/pages/PagesDirectory";
import ProjectDashboard from "@/pages/ProjectDashboard";
import Projects from "@/pages/Projects";
import Setup from "@/pages/Setup";
import Tasks from "@/pages/Tasks";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";

// Import new pages
import AdminPage from "@/pages/AdminPage";
import AutomationsPage from "@/pages/AutomationsPage";
import BestInClassExtrasPage from "@/pages/BestInClassExtrasPage";
import CalendarHub from "@/pages/CalendarHub";
import DeveloperPage from "@/pages/DeveloperPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";

// Auth context and components
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (simulate checking localStorage/sessionStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    const mockUser = { id: '1', email, name: email.split('@')[0] };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const signup = async (email: string, password: string, name: string) => {
    // Simulate API call
    const mockUser = { id: '1', email, name };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Project redirect component
const ProjectRedirect = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/dashboard`, { replace: true });
    }
  }, [projectId, navigate]);
  
  return null;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // For demo purposes, we'll assume the user is always authenticated
  // In a real app, you'd check authentication status here
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/setup" element={<RequireAuth><Setup /></RequireAuth>} />
            
            {/* Protected routes */}
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectRedirect />} />
              <Route path="/projects/:projectId/dashboard" element={<ProjectDashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/boards" element={<BoardsPage />} />
              <Route path="/calendar" element={<CalendarHub />} />
              <Route path="/pages" element={<PagesDirectory />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/notifications" element={<NotificationsCenter />} />
              <Route path="/custom-dashboard" element={<CustomDashboard />} />
              <Route path="/automations" element={<AutomationsPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/developer" element={<DeveloperPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/extras" element={<BestInClassExtrasPage />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
