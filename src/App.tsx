import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import ProjectDashboard from "@/pages/ProjectDashboard";
import Tasks from "@/pages/Tasks";
import BoardsPage from "@/pages/Boards";
import CalendarPage from "@/pages/CalendarPage";
import PagesDirectory from "@/pages/PagesDirectory";
import NotFound from "@/pages/NotFound";
import Notes from "@/pages/Notes";
import CustomDashboard from "@/pages/CustomDashboard";
import SignUp from "@/pages/auth/SignUp";
import Login from "@/pages/auth/Login";
import LandingPage from "@/pages/LandingPage";
import Setup from "@/pages/Setup";

// Import new pages
import AutomationsPage from "@/pages/AutomationsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import DeveloperPage from "@/pages/DeveloperPage";
import AdminPage from "@/pages/AdminPage";

// Authentication check component
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem('user');
    const authenticated = !!user;
    setIsAuthenticated(authenticated);
    
    // Check if setup is completed
    const userSetup = localStorage.getItem('userSetup');
    setIsSetupCompleted(!!userSetup);

    if (!authenticated && !['/login', '/signup', '/'].includes(location.pathname)) {
      // Redirect to login if not authenticated
      navigate('/login', { replace: true });
    } else if (authenticated && !userSetup && location.pathname !== '/setup') {
      // Redirect to setup if authenticated but setup not completed
      navigate('/setup', { replace: true });
    } else if (authenticated && userSetup && ['/login', '/signup', '/'].includes(location.pathname)) {
      // Redirect to dashboard if authenticated and setup completed but on auth pages
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (isAuthenticated === null) {
    // Still checking authentication
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return children;
};

// Placeholder pages for routes not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
      <p className="text-muted-foreground">This page is under development.</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/projects/:projectId/dashboard" element={<ProjectDashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/pages" element={<PagesDirectory />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/custom-dashboard" element={<CustomDashboard />} />
            {/* Updated routes to use new page components */}
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/developer" element={<DeveloperPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
