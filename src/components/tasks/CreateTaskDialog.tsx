
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from '@/hooks/useProjects';
import { useCreateTask } from '@/hooks/useTasks';
import React, { useState } from 'react';
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  tags: string[];
}

interface CreateTaskDialogProps {
  onTaskCreate: (task: Task) => void;
  statusColumn?: string;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ onTaskCreate, statusColumn }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState(statusColumn === 'To Do' ? 'TODO' : statusColumn === 'In Progress' ? 'IN_PROGRESS' : 'DONE');
  const [projectId, setProjectId] = useState('no-project');
  const [assigneeId, setAssigneeId] = useState('user-1');

  const { data: projectsData } = useProjects();
  const createTaskMutation = useCreateTask();
  const projects = projectsData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    // Project is optional for general tasks

    try {
      await createTaskMutation.mutateAsync({
        title,
        description,
        priority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
        status: status as 'TODO' | 'IN_PROGRESS' | 'DONE',
        projectId: projectId === 'no-project' ? null : projectId,
        assigneeId
      });

      toast.success("Task created successfully");
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create task");
      console.error('Error creating task:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setStatus(statusColumn === 'To Do' ? 'TODO' : statusColumn === 'In Progress' ? 'IN_PROGRESS' : 'DONE');
    setProjectId('no-project'); // Default to no project for general tasks
    setAssigneeId('user-1');
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
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
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-project">No Project (General Task)</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-1">John Doe</SelectItem>
                  <SelectItem value="user-2">Alice Smith</SelectItem>
                  <SelectItem value="user-3">Robert Miller</SelectItem>
                  <SelectItem value="user-4">Jane Wilson</SelectItem>
                  <SelectItem value="user-5">Thomas Wright</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
