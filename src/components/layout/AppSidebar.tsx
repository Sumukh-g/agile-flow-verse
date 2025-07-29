import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Briefcase,
    Calendar,
    Check,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Code,
    FileText,
    Folder,
    Layers,
    LayoutDashboard,
    MoreHorizontal,
    PanelRight,
    Pencil,
    Plus,
    Settings,
    Shield,
    Star,
    StickyNote,
    Trello,
    X,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on-hold';
}

export const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Marketing Campaign', status: 'active' },
    { id: 'p2', name: 'Website Redesign', status: 'active' },
    { id: 'p3', name: 'Mobile App', status: 'on-hold' },
    { id: 'p4', name: 'Q3 Planning', status: 'completed' }
  ]);
  const [newProject, setNewProject] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectStatus, setNewProjectStatus] = useState<'active' | 'on-hold' | 'completed'>('active');
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [customExpanded, setCustomExpanded] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  useEffect(() => {
    // Expand the projects drawer if we're on projects page or a specific project
    if (location.pathname.includes('/projects')) {
      setProjectsExpanded(true);
    }
  }, [location.pathname]);
  
  // Main navigation items
  const mainNavItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Projects', icon: Briefcase, path: '/projects' },
    { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { title: 'Boards', icon: Trello, path: '/boards' },
    { title: 'Calendar', icon: Calendar, path: '/calendar' },
    { title: 'Pages', icon: FileText, path: '/pages' },
    { title: 'Notes', icon: StickyNote, path: '/notes' },
    { title: 'Extras', icon: Star, path: '/extras' }
  ];

  // System navigation items
  const systemNavItems = [
    { title: 'Automations', icon: Zap, path: '/automations' },
    { title: 'Integrations', icon: Layers, path: '/integrations' },
    { title: 'Developer', icon: Code, path: '/developer' },
    { title: 'Admin', icon: Shield, path: '/admin' },
    { title: 'Settings', icon: Settings, path: '/settings' }
  ];

  // Custom sections
  const customSections = [
    { title: 'My Dashboard', icon: PanelRight, path: '/custom-dashboard' }
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
      status: newProjectStatus
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
    navigate(`/projects/${id}`);
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

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleSaveEdit = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editingName } : p));
    setEditingProjectId(null);
    setEditingName('');
    toast.success('Project name updated');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingName('');
  };

  const handleStatusChange = (id: string, status: Project['status']) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast.success('Project status updated');
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
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
                      end={item.path === '/dashboard'} 
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
            <SidebarGroupLabel 
              className={collapsed ? "sr-only" : ""} 
              onClick={() => setProjectsExpanded(!projectsExpanded)}
            >
              <div className="flex items-center cursor-pointer w-full group">
                Projects
                {!collapsed && (
                  <div className="ml-auto text-muted-foreground group-hover:text-foreground">
                    {projectsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
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
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input 
                        id="project-name" 
                        placeholder="Enter project name"
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-status">Status</Label>
                      <select
                        id="project-status"
                        value={newProjectStatus}
                        onChange={(e) => setNewProjectStatus(e.target.value as any)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
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
          
          {projectsExpanded && (
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
                            <div className="space-y-2">
                              <Label htmlFor="project-status-collapsed">Status</Label>
                              <select
                                id="project-status-collapsed"
                                value={newProjectStatus}
                                onChange={(e) => setNewProjectStatus(e.target.value as any)}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                              </select>
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
                      <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-sidebar-accent/50 cursor-pointer group">
                        <div className="flex items-center" onClick={() => handleViewProject(project.id)}>
                          <Folder className="mr-2 h-4 w-4 text-slate-400" />
                          {!collapsed && (
                            <>
                              {editingProjectId === project.id ? (
                                <>
                                  <input
                                    className="border rounded px-1 py-0.5 text-sm max-w-[90px]"
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveEdit(project.id);
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                  />
                                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => handleSaveEdit(project.id)}><Check className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                                </>
                              ) : (
                                <>
                                  <span className="truncate max-w-[90px]">{project.name}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100" onClick={e => { e.stopPropagation(); handleStartEdit(project); }}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Badge variant="outline" className={`ml-2 ${getStatusColor(project.status)} text-xs cursor-pointer`}>
                                    {project.status}
                                  </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'active')}>Active</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'on-hold')}>On Hold</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'completed')}>Completed</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
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
          )}
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel 
              className={collapsed ? "sr-only" : ""} 
              onClick={() => setCustomExpanded(!customExpanded)}
            >
              <div className="flex items-center cursor-pointer w-full group">
                Customize
                {!collapsed && (
                  <div className="ml-auto text-muted-foreground group-hover:text-foreground">
                    {customExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
            </SidebarGroupLabel>
            {!collapsed && customExpanded && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                navigate('/custom-dashboard');
                toast.info("Create your custom dashboard");
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {customExpanded && (
            <SidebarGroupContent>
              <SidebarMenu>
                {customSections.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.path} 
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
          )}
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
