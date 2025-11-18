import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useRealtime } from "@/hooks/useRealtime";

// Lazy load all pages for better code splitting
// Use new simplified functional pages
const BoardsPage = React.lazy(() => import("@/pages/BoardsSimple"));
const Projects = React.lazy(() => import("@/pages/Projects")); // Full CRM version
const Tasks = React.lazy(() => import("@/pages/TasksSimple"));
// Original pages
const CustomDashboard = React.lazy(() => import("@/pages/CustomDashboard"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const LandingPage = React.lazy(() => import("@/pages/LandingPage"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const Notes = React.lazy(() => import("@/pages/Notes"));
const NotificationsCenter = React.lazy(() => import("@/pages/NotificationsCenter"));
const PagesDirectory = React.lazy(() => import("@/pages/PagesDirectory"));
const ProjectDashboard = React.lazy(() => import("@/pages/ProjectDashboard"));
const Setup = React.lazy(() => import("@/pages/Setup"));
const Login = React.lazy(() => import("@/pages/auth/Login"));
const SignUp = React.lazy(() => import("@/pages/auth/SignUp"));
const ClearStorage = React.lazy(() => import("@/pages/ClearStorage"));

// Lazy load new pages
const AdminPage = React.lazy(() => import("@/pages/AdminPage"));
const AutomationsPage = React.lazy(() => import("@/pages/AutomationsPage"));
const BestInClassExtrasPage = React.lazy(() => import("@/pages/BestInClassExtrasPage"));
const CalendarHub = React.lazy(() => import("@/pages/CalendarHub"));
const CrmProjectDashboard = React.lazy(() => import("@/pages/CrmProjectDashboard"));
const DeveloperPage = React.lazy(() => import("@/pages/DeveloperPage"));
const IntegrationsPage = React.lazy(() => import("@/pages/IntegrationsPage"));
const SettingsPage = React.lazy(() => import("@/pages/SettingsPage"));

// Loading component for Suspense fallback
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Create a client - export it so it can be used to clear cache on logout
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 0, // Always consider data stale to prevent showing wrong user's data
    },
  },
});

// Inner component that uses hooks
const AppContent = () => {
  // Initialize real-time connection
  useRealtime();
  
  return (
    <Routes>
            {/* Public routes */}
            <Route path="/" element={
              <Suspense fallback={<PageLoading />}>
                <LandingPage />
              </Suspense>
            } />
            <Route path="/login" element={
              <Suspense fallback={<PageLoading />}>
                <Login />
              </Suspense>
            } />
            <Route path="/signup" element={
              <Suspense fallback={<PageLoading />}>
                <SignUp />
              </Suspense>
            } />
            <Route path="/clear-storage" element={
              <Suspense fallback={<PageLoading />}>
                <ClearStorage />
              </Suspense>
            } />
            
            {/* Protected routes with Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Default route for authenticated users - redirect to dashboard */}
              <Route path="/dashboard" element={
                <Suspense fallback={<PageLoading />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="/projects" element={
                <Suspense fallback={<PageLoading />}>
                  <Projects />
                </Suspense>
              } />
              <Route path="/projects/:id" element={
                <Suspense fallback={<PageLoading />}>
                  <ProjectDashboard />
                </Suspense>
              } />
              <Route path="/crm-projects/:id" element={
                <Suspense fallback={<PageLoading />}>
                  <CrmProjectDashboard />
                </Suspense>
              } />
              <Route path="/tasks" element={
                <Suspense fallback={<PageLoading />}>
                  <Tasks />
                </Suspense>
              } />
              <Route path="/boards" element={
                <Suspense fallback={<PageLoading />}>
                  <BoardsPage />
                </Suspense>
              } />
              <Route path="/notes" element={
                <Suspense fallback={<PageLoading />}>
                  <Notes />
                </Suspense>
              } />
              <Route path="/calendar" element={
                <Suspense fallback={<PageLoading />}>
                  <CalendarHub />
                </Suspense>
              } />
              <Route path="/notifications" element={
                <Suspense fallback={<PageLoading />}>
                  <NotificationsCenter />
                </Suspense>
              } />
              <Route path="/pages" element={
                <Suspense fallback={<PageLoading />}>
                  <PagesDirectory />
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<PageLoading />}>
                  <SettingsPage />
                </Suspense>
              } />
              <Route path="/admin" element={
                <Suspense fallback={<PageLoading />}>
                  <AdminPage />
                </Suspense>
              } />
              <Route path="/automations" element={
                <Suspense fallback={<PageLoading />}>
                  <AutomationsPage />
                </Suspense>
              } />
              <Route path="/integrations" element={
                <Suspense fallback={<PageLoading />}>
                  <IntegrationsPage />
                </Suspense>
              } />
              <Route path="/developer" element={
                <Suspense fallback={<PageLoading />}>
                  <DeveloperPage />
                </Suspense>
              } />
              <Route path="/extras" element={
                <Suspense fallback={<PageLoading />}>
                  <BestInClassExtrasPage />
                </Suspense>
              } />
              <Route path="/setup" element={
                <Suspense fallback={<PageLoading />}>
                  <Setup />
                </Suspense>
              } />
            </Route>
            
            <Route path="*" element={
              <Suspense fallback={<PageLoading />}>
                <NotFound />
              </Suspense>
            } />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
