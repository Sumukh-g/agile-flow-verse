
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Trello,
  Calendar,
  FileText,
  Zap,
  Layers,
  Code,
  Shield
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // Main navigation items
  const mainNavItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Projects', icon: Briefcase, path: '/projects' },
    { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { title: 'Boards', icon: Trello, path: '/boards' },
    { title: 'Calendar', icon: Calendar, path: '/calendar' },
    { title: 'Pages', icon: FileText, path: '/pages' }
  ];

  // System navigation items
  const systemNavItems = [
    { title: 'Automations', icon: Zap, path: '/automations' },
    { title: 'Integrations', icon: Layers, path: '/integrations' },
    { title: 'Developer', icon: Code, path: '/developer' },
    { title: 'Admin', icon: Shield, path: '/admin' }
  ];
  
  // Helper to determine if a nav item is active
  const getNavClass = ({ isActive }: { isActive: boolean }) => {
    return isActive 
      ? "bg-sidebar-accent text-primary font-medium" 
      : "text-sidebar-foreground hover:bg-sidebar-accent/50";
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path} 
                      end={item.path === '/'} 
                      className={getNavClass}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.path} className={getNavClass}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
