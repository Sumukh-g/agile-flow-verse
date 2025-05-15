import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from './Header';
import AppSidebar from './AppSidebar';
import StickyNote from '@/components/global/StickyNote';

const Layout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    console.log('Toggling mobile sidebar. Current state:', mobileSidebarOpen, 'New state:', !mobileSidebarOpen);
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header toggleMobileSidebar={toggleMobileSidebar} />
        <div className="flex flex-1 overflow-hidden">
          {mobileSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
          
          <div 
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r md:hidden shadow-lg transform transition-transform duration-300 ease-in-out ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <AppSidebar />
          </div>
          
          <div className="hidden md:block border-r bg-background">
            <AppSidebar />
          </div>
          
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
              <Outlet />
            </div>
          </main>
        </div>
        <StickyNote />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
