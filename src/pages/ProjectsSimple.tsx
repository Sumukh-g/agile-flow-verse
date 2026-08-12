import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { 
  useProjects, 
  useDeleteProject, 
  useBulkDeleteProjects, 
  useBulkArchiveProjects,
  useBulkUnarchiveProjects,
  useArchiveProject,
  useUnarchiveProject
} from '@/hooks/useProjectsEnhanced';
import { Project } from '@/lib/api/types';
import { Archive, ArchiveRestore, Edit, Plus, Search, Trash2, FolderOpen, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ProjectsSimple: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const { data: projects = [], isLoading } = useProjects({ showDeleted: false });
  const deleteProject = useDeleteProject();
  const bulkDelete = useBulkDeleteProjects();
  const bulkArchive = useBulkArchiveProjects();
  const bulkUnarchive = useBulkUnarchiveProjects();
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();
  const navigate = useNavigate();

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Filter by search term
      const matchesSearch = 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by archived status
      const matchesArchived = showArchived ? true : !project.archived;
      
      return matchesSearch && matchesArchived;
    });
  }, [projects, searchTerm, showArchived]);

  const selectedCount = selectedProjectIds.size;
  const allSelected = filteredProjects.length > 0 && selectedProjectIds.size === filteredProjects.length;
  const someSelected = selectedProjectIds.size > 0 && selectedProjectIds.size < filteredProjects.length;

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? It will be moved to bin and can be restored later.`)) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project.id);
    } catch (error: any) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleSelect = (projectId: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedProjectIds(new Set());
    } else {
      setSelectedProjectIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjectIds.size === 0) return;
    
    const count = selectedProjectIds.size;
    if (!confirm(`Are you sure you want to delete ${count} project(s)? They will be moved to bin.`)) {
      return;
    }

    try {
      await bulkDelete.mutateAsync(Array.from(selectedProjectIds));
      setSelectedProjectIds(new Set());
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProjectIds.size === 0) return;
    
    try {
      await bulkArchive.mutateAsync(Array.from(selectedProjectIds));
      setSelectedProjectIds(new Set());
    } catch (error: any) {
      console.error('Bulk archive failed:', error);
    }
  };

  const handleBulkUnarchive = async () => {
    if (selectedProjectIds.size === 0) return;
    
    try {
      await bulkUnarchive.mutateAsync(Array.from(selectedProjectIds));
      setSelectedProjectIds(new Set());
    } catch (error: any) {
      console.error('Bulk unarchive failed:', error);
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      if (project.archived) {
        await unarchiveProject.mutateAsync(project.id);
      } else {
        await archiveProject.mutateAsync(project.id);
      }
    } catch (error: any) {
      console.error('Archive failed:', error);
    }
  };

  const handleView = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <FolderOpen className="mr-3 h-7 w-7 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your projects
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search Bar and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showArchived ? "default" : "outline"}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="w-4 h-4 mr-2" />
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedCount > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedCount} project{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProjectIds(new Set())}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex gap-2">
                {filteredProjects.some(p => selectedProjectIds.has(p.id) && !p.archived) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={bulkArchive.isPending}
                  >
                    <Archive className="w-4 h-4 mr-1" />
                    Archive
                  </Button>
                )}
                {filteredProjects.some(p => selectedProjectIds.has(p.id) && p.archived) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkUnarchive}
                    disabled={bulkUnarchive.isPending}
                  >
                    <ArchiveRestore className="w-4 h-4 mr-1" />
                    Unarchive
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDelete.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No projects found</p>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first project'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All Checkbox */}
          {filteredProjects.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as any).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all ({filteredProjects.length})
              </span>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className={`hover:shadow-lg transition-shadow ${
                  project.archived ? 'opacity-60' : ''
                } ${selectedProjectIds.has(project.id) ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Checkbox
                      checked={selectedProjectIds.has(project.id)}
                      onCheckedChange={() => handleToggleSelect(project.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1" onClick={() => handleView(project.id)}>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                        {project.archived && (
                          <Badge variant="outline" className="text-xs">
                            <Archive className="w-3 h-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Progress</p>
                    <p className="font-medium">{project.progress}%</p>
                  </div>
                  {project.budget && (
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">${project.budget.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {(project.startDate || project.endDate) && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Timeline</p>
                    <p className="font-medium">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(project);
                    }}
                    title={project.archived ? 'Unarchive' : 'Archive'}
                  >
                    {project.archived ? (
                      <ArchiveRestore className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}

      {/* Project Dialog */}
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
      />
    </div>
  );
};

export default ProjectsSimple;




