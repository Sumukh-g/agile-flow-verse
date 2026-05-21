/**
 * MobileSidebarContent Component
 * 
 * Optimized mobile sidebar with full navigation and scrolling support.
 * Matches the desktop sidebar navigation items for consistency.
 * 
 * @module components/layout/MobileSidebarContent
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Layers,
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
  Zap
} from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from "sonner";

// ============================================
// TYPES & CONSTANTS
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

interface MobileSidebarContentProps {
  onNavigate?: () => void;
}

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
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-amber-100 text-amber-800',
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MobileSidebarContent = memo(({ onNavigate }: MobileSidebarContentProps) => {
  const navigate = useNavigate();
  
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

  // Navigation class helper
  const getNavClass = useCallback(({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      isActive 
        ? "bg-primary/10 text-primary font-medium" 
        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`,
    []
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

  const handleStatusChange = useCallback(async (id: string, status: Project['status']) => {
    try {
      await updateProject.mutateAsync({ id, data: { status } });
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  }, [updateProject]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-14 px-4 border-b flex items-center">
        <NavLink to="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            AF
          </div>
          <span className="font-semibold text-lg tracking-tight">AgileFlow</span>
        </NavLink>
      </div>
      
      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main
            </p>
            <nav className="space-y-1">
              {MAIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={getNavClass}
                  onClick={onNavigate}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Projects Section */}
          <div>
            <div 
              className="flex items-center justify-between px-3 mb-2 cursor-pointer"
              onClick={() => setProjectsExpanded(!projectsExpanded)}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                Projects
                {projectsExpanded 
                  ? <ChevronDown className="ml-1 h-3 w-3" />
                  : <ChevronRight className="ml-1 h-3 w-3" />
                }
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>New Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile-project-name">Name</Label>
                      <Input 
                        id="mobile-project-name" 
                        placeholder="Project name"
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-project-status">Status</Label>
                      <select
                        id="mobile-project-status"
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
            </div>
            
            {projectsExpanded && (
              <div className="space-y-1">
                {projects.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-3 py-2">
                    No projects yet
                  </div>
                ) : (
                  projects.map((project) => (
                    <div 
                      key={project.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                    >
                      <div 
                        className="flex items-center gap-2 flex-1 min-w-0" 
                        onClick={() => handleViewProject(project.id)}
                      >
                        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                        {editingProjectId === project.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(project.id);
                                if (e.key === 'Escape') { setEditingProjectId(null); setEditingName(''); }
                              }}
                              className="h-7 w-24 text-sm"
                              autoFocus
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSaveEdit(project.id)}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingProjectId(null); setEditingName(''); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate text-sm">{project.name}</span>
                            <Badge variant="outline" className={`ml-auto text-xs shrink-0 ${STATUS_COLORS[project.status]}`}>
                              {project.status}
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      {editingProjectId !== project.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProject(project.id)}>
                              View Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingProjectId(project.id); setEditingName(project.name); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'active')}>Set Active</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'on-hold')}>Set On Hold</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'completed')}>Set Completed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-destructive">
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* System Navigation */}
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              System
            </p>
            <nav className="space-y-1">
              {SYSTEM_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={getNavClass}
                  onClick={onNavigate}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Bottom padding */}
        <div className="h-4" />
      </ScrollArea>
      
      {/* Footer */}
      <div className="h-10 border-t flex items-center justify-center">
        <span className="text-xs text-muted-foreground">v1.0.0 • AgileFlow</span>
      </div>
    </div>
  );
});

MobileSidebarContent.displayName = 'MobileSidebarContent';

export default MobileSidebarContent;
