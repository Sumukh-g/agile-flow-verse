
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { User } from 'lucide-react';

interface CreateTaskDialogProps {
  onTaskCreate?: () => void; // Optional callback
  projectId?: string; // Optional project ID (can be undefined for personal tasks)
  statusColumn?: string;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ onTaskCreate, projectId, statusColumn }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState(statusColumn || 'todo');
  const [dueDate, setDueDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [tags, setTags] = useState('');
  
  const createTask = useCreateTask();
  const { data: projects = [] } = useProjects();

  // Map frontend status to backend status
  const mapStatus = (frontendStatus: string): 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled' => {
    const statusMap: Record<string, 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled'> = {
      'To Do': 'todo',
      'todo': 'todo',
      'In Progress': 'in-progress',
      'in-progress': 'in-progress',
      'In Review': 'review',
      'review': 'review',
      'Done': 'done',
      'done': 'done',
      'Blocked': 'blocked',
      'blocked': 'blocked',
      'Cancelled': 'cancelled',
      'cancelled': 'cancelled',
    };
    return statusMap[frontendStatus] || 'todo';
  };

  // Map frontend priority to backend priority
  const mapPriority = (frontendPriority: string): 'low' | 'medium' | 'high' | 'critical' => {
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'Low': 'low',
      'low': 'low',
      'Medium': 'medium',
      'medium': 'medium',
      'High': 'high',
      'high': 'high',
      'Critical': 'critical',
      'critical': 'critical',
    };
    return priorityMap[frontendPriority] || 'medium';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    // Allow personal tasks (no projectId) or project tasks
    const finalProjectId = selectedProjectId === 'personal' ? undefined : (selectedProjectId || projectId);

    try {
      await createTask.mutateAsync({
        title,
        description,
        projectId: finalProjectId, // Can be undefined for personal tasks
        status: mapStatus(status),
        priority: mapPriority(priority),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      });

      toast.success("Task created successfully");
      setOpen(false);
      resetForm();
      
      if (onTaskCreate) {
        onTaskCreate();
      }
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.response?.data?.message || "Failed to create task");
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus(statusColumn || 'todo');
    setDueDate('');
    setSelectedProjectId(projectId || '');
    setTags('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <span>Create Task</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select 
              value={selectedProjectId || (projectId || 'personal')} 
              onValueChange={(value) => {
                setSelectedProjectId(value === 'personal' ? 'personal' : value);
              }}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select project or personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Personal</span>
                  </div>
                </SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select "Personal" to create a task without a project
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. Frontend, Bug, Design"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createTask.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
