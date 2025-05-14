
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface ProjectSettingsPanelProps {
  projectId?: string;
}

const ProjectSettingsPanel = ({ projectId }: ProjectSettingsPanelProps) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '',
    startDate: '',
    endDate: '',
    visibility: '',
    tags: ''
  });
  
  useEffect(() => {
    // Fetch project data based on projectId
    setTimeout(() => {
      const mockProject = {
        id: projectId,
        name: `Project ${projectId}`,
        description: 'This is a detailed project description that provides context about goals and scope.',
        status: 'In Progress',
        startDate: '2023-05-01',
        endDate: '2023-06-30',
        visibility: 'Team',
        tags: 'development,design,marketing'
      };
      
      setProject(mockProject);
      setFormData({
        name: mockProject.name,
        description: mockProject.description,
        status: mockProject.status,
        startDate: mockProject.startDate,
        endDate: mockProject.endDate,
        visibility: mockProject.visibility,
        tags: mockProject.tags
      });
      setLoading(false);
    }, 800);
  }, [projectId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Project settings saved');
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>Loading project settings...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-center">
            <p>Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
        <CardDescription>Configure project details and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="project-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => handleSelectChange('visibility', value)}
                >
                  <SelectTrigger id="project-visibility">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                    <SelectItem value="Organization">Organization</SelectItem>
                    <SelectItem value="Public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-tags">Tags</Label>
              <Input
                id="project-tags"
                name="tags"
                placeholder="Enter tags separated by commas"
                value={formData.tags}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas (e.g. development, design, marketing)
              </p>
            </div>
          </div>
          
          <div className="pt-4 flex items-center justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => toast.error('Project deletion is disabled in demo mode')}
              className="text-red-600"
            >
              Delete Project
            </Button>
            
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline">Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectSettingsPanel;
