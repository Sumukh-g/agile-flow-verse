
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from './Header';
import AppSidebar from './AppSidebar';

const Layout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header toggleMobileSidebar={toggleMobileSidebar} />
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
          
          {/* Mobile sidebar */}
          <div 
            className={`fixed inset-y-0 left-0 z-50 w-60 bg-sidebar transform transition-transform duration-300 ease-in-out md:hidden ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <AppSidebar />
          </div>
          
          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <AppSidebar />
          </div>
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container py-6 md:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
