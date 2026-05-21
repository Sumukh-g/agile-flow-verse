/**
 * Layout Component
 * 
 * Main application layout with responsive sidebar.
 * Uses CSS media queries for reliable responsive behavior.
 * 
 * Features:
 * - Responsive sidebar (mobile/desktop)
 * - Global search command palette (Cmd+K / Ctrl+K)
 * - Floating overlays (sticky note, AI chat)
 */

import AgentChatButton from '@/components/ai/AgentChatButton';
import StickyNote from '@/components/global/StickyNote';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import Header from './Header';
import MobileSidebarContent from './MobileSidebarContent';

const Layout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      {/* ============================================================ */}
      {/* MOBILE SIDEBAR - Only visible on small screens */}
      {/* Uses fixed positioning and is toggled via state */}
      {/* ============================================================ */}
      
      {/* Backdrop - only shown when mobile sidebar is open */}
      <div 
        className={`
          fixed inset-0 z-40 bg-black/60 backdrop-blur-sm
          md:hidden
          transition-opacity duration-300
          ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />
      
      {/* Mobile Sidebar Panel */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 
          bg-white dark:bg-slate-900 
          border-r shadow-2xl
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <MobileSidebarContent onNavigate={closeMobileSidebar} />
      </div>

      {/* ============================================================ */}
      {/* MAIN LAYOUT CONTAINER */}
      {/* ============================================================ */}
      <div className="flex min-h-screen w-full bg-muted/40">
        
        {/* Desktop Sidebar - hidden on mobile, visible on md+ */}
        <div className="hidden md:block flex-shrink-0">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <Header 
            toggleMobileSidebar={toggleMobileSidebar}
            toggleDesktopSidebar={() => {}}
            isMobileSidebarOpen={mobileSidebarOpen}
            isMobile={false}
          />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      
      {/* Floating overlays */}
      <StickyNote />
      <AgentChatButton />
      
      {/* Global Search Command Palette - triggered by Cmd+K / Ctrl+K */}
      <GlobalSearch />
    </SidebarProvider>
  );
};

export default Layout;
