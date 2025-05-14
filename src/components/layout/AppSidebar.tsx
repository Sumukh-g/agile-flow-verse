
import React, { useState } from 'react';
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
  Shield,
  Plus,
  MoreHorizontal,
  Settings,
  Star,
  Folder
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on-hold';
}

export const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Marketing Campaign', status: 'active' },
    { id: 'p2', name: 'Website Redesign', status: 'active' },
    { id: 'p3', name: 'Mobile App', status: 'on-hold' },
    { id: 'p4', name: 'Q3 Planning', status: 'completed' }
  ]);
  const [newProject, setNewProject] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
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

  const handleAddProject = () => {
    if (!newProject.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    const newProjectItem: Project = {
      id: `p${Date.now()}`,
      name: newProject,
      status: 'active'
    };
    
    setProjects(prev => [...prev, newProjectItem]);
    setNewProject('');
    setDialogOpen(false);
    toast.success('Project added successfully');
  };

  const handleStarProject = (id: string) => {
    toast.success('Project added to favorites');
  };

  const handleViewProject = (id: string) => {
    // Here we would typically navigate to the project page
    toast.info(`Opening project ${projects.find(p => p.id === id)?.name}`);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Project removed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
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
          <div className="flex items-center justify-between">
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Projects
            </SidebarGroupLabel>
            {!collapsed && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input 
                        id="project-name" 
                        placeholder="Enter project name"
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddProject}>Add Project</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {collapsed ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-full justify-center">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="project-name-collapsed">Project Name</Label>
                            <Input 
                              id="project-name-collapsed" 
                              placeholder="Enter project name"
                              value={newProject}
                              onChange={(e) => setNewProject(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleAddProject}>Add Project</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              
              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton asChild>
                    <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-sidebar-accent/50 cursor-pointer">
                      <div className="flex items-center" onClick={() => handleViewProject(project.id)}>
                        <Folder className="mr-2 h-4 w-4 text-slate-400" />
                        {!collapsed && (
                          <span className="truncate max-w-[120px]">{project.name}</span>
                        )}
                      </div>
                      
                      {!collapsed && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProject(project.id)}>
                              View Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStarProject(project.id)}>
                              Add to Favorites
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-red-600">
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
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
