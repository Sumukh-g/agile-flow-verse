/**
 * AppSidebar Component
 * 
 * Responsive sidebar navigation with scrollable content.
 * Optimized for performance with memoization and proper responsive handling.
 * 
 * Features:
 * - Full-height scrollable navigation
 * - Collapsible sections
 * - Project management (CRUD)
 * - Responsive design (mobile/desktop)
 * 
 * @module components/layout/AppSidebar
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from '@/hooks/useProjects';
import {
  BarChart3,
  Briefcase,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Code,
  FileText,
  Folder,
  LayoutDashboard,
  LayoutList,
  Map,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Shield,
  Star,
  StickyNote,
  Target,
  Trello,
  X,
  Zap,
  Layers
} from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on-hold';
}

interface AppSidebarProps {
  onNavigate?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const MAIN_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'CRM', icon: Briefcase, path: '/projects' },
  { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { title: 'Boards', icon: Trello, path: '/boards' },
  { title: 'Backlog', icon: LayoutList, path: '/backlog' },
  { title: 'Sprint', icon: Target, path: '/sprint' },
  { title: 'Epics', icon: Map, path: '/epics' },
  { title: 'Calendar', icon: Calendar, path: '/calendar' },
  { title: 'Pages', icon: FileText, path: '/pages' },
  { title: 'Notes', icon: StickyNote, path: '/notes' },
  { title: 'Extras', icon: Star, path: '/extras' },
];

const SYSTEM_NAV_ITEMS: NavItem[] = [
  { title: 'Automations', icon: Zap, path: '/automations' },
  { title: 'Reports', icon: BarChart3, path: '/reports' },
  { title: 'Integrations', icon: Layers, path: '/integrations' },
  { title: 'Developer', icon: Code, path: '/developer' },
  { title: 'Admin', icon: Shield, path: '/admin' },
  { title: 'Settings', icon: Settings, path: '/settings' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'on-hold': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

// ============================================
// SUB-COMPONENTS (Memoized for performance)
// ============================================

/**
 * Navigation Item Component
 * Renders a single navigation link with tooltip support
 */
const NavItem = memo(({ 
  item, 
  collapsed, 
  onNavigate 
}: { 
  item: NavItem; 
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const Icon = item.icon;
  
  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton asChild>
            <NavLink 
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) => 
                isActive 
                  ? "bg-sidebar-accent text-primary font-medium flex items-center" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 flex items-center"
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="ml-2 truncate">{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        )}
      </Tooltip>
    </SidebarMenuItem>
  );
});
NavItem.displayName = 'NavItem';

/**
 * Project Item Component
 * Renders a project with edit, status change, and delete actions
 */
const ProjectItem = memo(({
  project,
  collapsed,
  isEditing,
  editingName,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onView,
  onStatusChange,
  onDelete,
  onStar,
}: {
  project: Project;
  collapsed: boolean;
  isEditing: boolean;
  editingName: string;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;
  onView: () => void;
  onStatusChange: (status: Project['status']) => void;
  onDelete: () => void;
  onStar: () => void;
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onEditSave();
    if (e.key === 'Escape') onEditCancel();
  }, [onEditSave, onEditCancel]);

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton onClick={onView}>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">{project.name}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <div className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 group">
        <div className="flex items-center min-w-0 flex-1 cursor-pointer" onClick={onView}>
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          
          {isEditing ? (
            <div className="flex items-center ml-2 gap-1">
              <Input
                value={editingName}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-6 w-20 text-sm"
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onEditSave(); }}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onEditCancel(); }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span className="ml-2 truncate text-sm max-w-[80px]">{project.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 opacity-0 group-hover:opacity-100 shrink-0"
                onClick={(e) => { e.stopPropagation(); onEditStart(); }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`${STATUS_COLORS[project.status]} text-xs cursor-pointer px-1.5`}
                >
                  {project.status}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStatusChange('active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('on-hold')}>On Hold</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('completed')}>Completed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>View Project</DropdownMenuItem>
                <DropdownMenuItem onClick={onStar}>Add to Favorites</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </SidebarMenuItem>
  );
});
ProjectItem.displayName = 'ProjectItem';

// ============================================
// MAIN COMPONENT
// ============================================

export const AppSidebar = memo(({ onNavigate }: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  
  // API hooks
  const { data: apiProjects = [] } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  
  // Local state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<Project['status']>('active');
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Transform API projects
  const projects = useMemo<Project[]>(() => 
    apiProjects.map(p => ({
      id: p.id,
      name: p.name,
      status: (p.status === 'active' ? 'active' : p.status === 'completed' ? 'completed' : 'on-hold') as Project['status']
    })),
    [apiProjects]
  );

  // Handlers
  const handleAddProject = useCallback(async () => {
    if (!newProject.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    try {
      await createProject.mutateAsync({
        name: newProject,
        status: newProjectStatus,
        priority: 'medium',
        progress: 0
      });
      toast.success('Project created');
      setNewProject('');
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create project');
    }
  }, [newProject, newProjectStatus, createProject]);

  const handleViewProject = useCallback((id: string) => {
    navigate(`/projects/${id}`);
    onNavigate?.();
  }, [navigate, onNavigate]);

  const handleDeleteProject = useCallback(async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success('Project removed');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete project');
    }
  }, [deleteProject]);

  const handleStatusChange = useCallback(async (id: string, status: Project['status']) => {
    try {
      await updateProject.mutateAsync({ id, data: { status } });
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  }, [updateProject]);

  const handleSaveEdit = useCallback(async (id: string) => {
    if (!editingName.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await updateProject.mutateAsync({ id, data: { name: editingName } });
      setEditingProjectId(null);
      setEditingName('');
      toast.success('Name updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update name');
    }
  }, [editingName, updateProject]);

  return (
    <Sidebar collapsible="icon">
      {/* Header with Logo */}
      <SidebarHeader className="h-14 border-b flex items-center justify-center">
        <NavLink to="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            AF
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg tracking-tight">AgileFlow</span>
          )}
        </NavLink>
      </SidebarHeader>

      {/* Scrollable Content */}
      <SidebarContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <TooltipProvider delayDuration={0}>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Main
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {MAIN_NAV_ITEMS.map((item) => (
                    <NavItem 
                      key={item.path} 
                      item={item} 
                      collapsed={collapsed} 
                      onNavigate={onNavigate}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Projects Section */}
            <SidebarGroup>
              <div className="flex items-center justify-between">
                <SidebarGroupLabel 
                  className={`${collapsed ? "sr-only" : ""} cursor-pointer flex-1`}
                  onClick={() => setProjectsExpanded(!projectsExpanded)}
                >
                  <div className="flex items-center w-full">
                    <span>Projects</span>
                    {!collapsed && (
                      projectsExpanded 
                        ? <ChevronDown className="ml-auto h-4 w-4" />
                        : <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </div>
                </SidebarGroupLabel>
                
                {!collapsed && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="project-name">Name</Label>
                          <Input 
                            id="project-name" 
                            placeholder="Project name"
                            value={newProject}
                            onChange={(e) => setNewProject(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-status">Status</Label>
                          <select
                            id="project-status"
                            value={newProjectStatus}
                            onChange={(e) => setNewProjectStatus(e.target.value as Project['status'])}
                            className="w-full h-10 px-3 rounded-md border bg-background"
                          >
                            <option value="active">Active</option>
                            <option value="on-hold">On Hold</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddProject} disabled={createProject.isPending}>
                          {createProject.isPending ? 'Creating...' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {projectsExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projects.length === 0 ? (
                      <div className={`text-xs text-muted-foreground px-2 py-1 ${collapsed ? 'hidden' : ''}`}>
                        No projects yet
                      </div>
                    ) : (
                      projects.map((project) => (
                        <ProjectItem
                          key={project.id}
                          project={project}
                          collapsed={collapsed}
                          isEditing={editingProjectId === project.id}
                          editingName={editingName}
                          onEditStart={() => { setEditingProjectId(project.id); setEditingName(project.name); }}
                          onEditSave={() => handleSaveEdit(project.id)}
                          onEditCancel={() => { setEditingProjectId(null); setEditingName(''); }}
                          onEditChange={setEditingName}
                          onView={() => handleViewProject(project.id)}
                          onStatusChange={(status) => handleStatusChange(project.id, status)}
                          onDelete={() => handleDeleteProject(project.id)}
                          onStar={() => toast.success('Added to favorites')}
                        />
                      ))
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            {/* System Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {SYSTEM_NAV_ITEMS.map((item) => (
                    <NavItem 
                      key={item.path} 
                      item={item} 
                      collapsed={collapsed} 
                      onNavigate={onNavigate}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </TooltipProvider>
          
          {/* Bottom padding for scroll */}
          <div className="h-4" />
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-2">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            v1.0.0 • AgileFlow
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
});

AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;
