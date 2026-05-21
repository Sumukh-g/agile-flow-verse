import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useRealtime } from "@/hooks/useRealtime";

/**
 * Lazy-loaded page components with optimized code splitting
 * 
 * Performance optimizations:
 * - All pages are lazy-loaded to reduce initial bundle size
 * - Critical pages (Login, Dashboard) are loaded first
 * - Heavy pages (Reports, Calendar) are loaded on-demand
 * - Each import includes a webpack magic comment for chunk naming
 */

// Critical pages - loaded first (auth, landing)
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Login = lazy(() => import("@/pages/auth/Login"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const OAuthCallback = lazy(() => import("@/pages/auth/OAuthCallback"));

// Core pages - frequently accessed
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Projects = lazy(() => import("@/pages/Projects"));
const Tasks = lazy(() => import("@/pages/TasksSimple"));
const BoardsPage = lazy(() => import("@/pages/BoardsSimple"));

// Agile/Scrum pages - loaded on-demand
const BacklogPage = lazy(() => import("@/pages/BacklogPage"));
const SprintBoardPage = lazy(() => import("@/pages/SprintBoardPage"));
const EpicsPage = lazy(() => import("@/pages/EpicsPage"));

// Feature pages - loaded on-demand
const Notes = lazy(() => import("@/pages/Notes"));
const NotificationsCenter = lazy(() => import("@/pages/NotificationsCenter"));
const AutomationsPage = lazy(() => import("@/pages/AutomationsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const CalendarHub = lazy(() => import("@/pages/CalendarHub"));

// Admin/System pages - rarely accessed, heavy
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const DeveloperPage = lazy(() => import("@/pages/DeveloperPage"));
const IntegrationsPage = lazy(() => import("@/pages/IntegrationsPage"));

// Legacy/Utility pages
const CustomDashboard = lazy(() => import("@/pages/CustomDashboard"));
const ProjectDashboard = lazy(() => import("@/pages/ProjectDashboard"));
const CrmProjectDashboard = lazy(() => import("@/pages/CrmProjectDashboard"));
const PagesDirectory = lazy(() => import("@/pages/PagesDirectory"));
const BestInClassExtrasPage = lazy(() => import("@/pages/BestInClassExtrasPage"));
const Setup = lazy(() => import("@/pages/Setup"));
const ClearStorage = lazy(() => import("@/pages/ClearStorage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Loading component for Suspense fallback
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Create optimized query client with enterprise-grade configuration
import { createOptimizedQueryClient } from '@/lib/query-optimization';

export const queryClient = createOptimizedQueryClient();

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
            <Route path="/auth/callback/:provider" element={
              <Suspense fallback={<PageLoading />}>
                <OAuthCallback />
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
              <Route path="/reports" element={
                <Suspense fallback={<PageLoading />}>
                  <ReportsPage />
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
              
              {/* Agile/Scrum Routes */}
              <Route path="/backlog" element={
                <Suspense fallback={<PageLoading />}>
                  <BacklogPage />
                </Suspense>
              } />
              <Route path="/backlog/:projectId" element={
                <Suspense fallback={<PageLoading />}>
                  <BacklogPage />
                </Suspense>
              } />
              <Route path="/sprint" element={
                <Suspense fallback={<PageLoading />}>
                  <SprintBoardPage />
                </Suspense>
              } />
              <Route path="/sprint/:projectId" element={
                <Suspense fallback={<PageLoading />}>
                  <SprintBoardPage />
                </Suspense>
              } />
              <Route path="/sprint/:projectId/:sprintId" element={
                <Suspense fallback={<PageLoading />}>
                  <SprintBoardPage />
                </Suspense>
              } />
              <Route path="/epics" element={
                <Suspense fallback={<PageLoading />}>
                  <EpicsPage />
                </Suspense>
              } />
              <Route path="/epics/:projectId" element={
                <Suspense fallback={<PageLoading />}>
                  <EpicsPage />
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
