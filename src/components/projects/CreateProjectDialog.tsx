
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateProjectDto, useCreateProject } from '@/hooks/useProjects';
import React, { useState } from 'react';
import { toast } from "sonner";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  members: string[];
  team: string;
  created: string;
}

interface CreateProjectDialogProps {
  onProjectCreate?: (project: Project) => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ onProjectCreate }) => {
  const createProjectMutation = useCreateProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Planning');
  const [team, setTeam] = useState('Design');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['JD']);
  
  const teams = ['Design', 'Frontend', 'Backend', 'Mobile', 'DevOps', 'Marketing', 'Security'];
  const members = [
    { id: 'JD', name: 'John Doe' },
    { id: 'AS', name: 'Alice Smith' },
    { id: 'RM', name: 'Robert Miller' },
    { id: 'JW', name: 'Jane Wilson' },
    { id: 'TW', name: 'Thomas Wright' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      const projectData: CreateProjectDto = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      const newProject = await createProjectMutation.mutateAsync(projectData);
      
      if (onProjectCreate) {
        onProjectCreate(newProject);
      }
      
      toast.success("Project created successfully");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('Planning');
    setTeam('Design');
    setSelectedMembers(['JD']);
  };
  
  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <span className="flex items-center">
            New Project
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team Members</Label>
            <div className="grid grid-cols-2 gap-2">
              {members.map(member => (
                <Button
                  type="button"
                  key={member.id}
                  variant={selectedMembers.includes(member.id) ? "default" : "outline"}
                  onClick={() => toggleMember(member.id)}
                  className="justify-start"
                >
                  <span className="mr-2">{member.id}</span>
                  {member.name}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
