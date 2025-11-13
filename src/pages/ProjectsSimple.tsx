import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { useProjects, useDeleteProject, Project } from '@/hooks/useProjects';
import { Edit, Plus, Search, Trash2, FolderOpen } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ProjectsSimple: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project.id);
      toast.success('Project deleted successfully');
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete project');
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

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleView(project.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
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
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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




