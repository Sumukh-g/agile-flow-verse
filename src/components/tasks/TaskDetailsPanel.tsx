
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock, FileText, LinkIcon, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  status: string;
}

interface TaskDetailsPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (task: Task) => void;
}

const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({ 
  task, 
  isOpen, 
  onClose,
  onTaskUpdate
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [taskTitle, setTaskTitle] = useState(task?.title || '');
  const [taskDescription, setTaskDescription] = useState(task?.description || '');

  // Mock comments data
  const [comments, setComments] = useState([
    {
      id: 'c1',
      author: 'JD',
      fullName: 'John Doe',
      text: 'This task needs more details before I can start working on it.',
      timestamp: 'Today at 10:23 AM',
    },
    {
      id: 'c2',
      author: 'AS',
      fullName: 'Alice Smith',
      text: 'I will add more information shortly. Please wait for my update.',
      timestamp: 'Today at 11:05 AM',
    },
  ]);

  // Mock subtasks data
  const [subtasks, setSubtasks] = useState([
    { id: 'st1', title: 'Research competitors', completed: true },
    { id: 'st2', title: 'Draft initial specifications', completed: false },
    { id: 'st3', title: 'Get feedback from team', completed: false },
  ]);

  // Mock attachments data
  const [attachments, setAttachments] = useState([
    { id: 'a1', name: 'requirements.pdf', size: '2.4 MB', type: 'application/pdf', uploadedBy: 'JD', timestamp: 'Yesterday' },
    { id: 'a2', name: 'mockup.png', size: '1.7 MB', type: 'image/png', uploadedBy: 'AS', timestamp: 'Yesterday' },
  ]);

  if (!task) return null;

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: `c${comments.length + 1}`,
        author: 'JD', // This would come from the logged-in user
        fullName: 'John Doe',
        text: commentText,
        timestamp: 'Just now'
      };
      
      setComments([...comments, newComment]);
      setCommentText('');
      toast.success("Comment added successfully");
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    ));
    toast.success("Subtask status updated");
  };

  const addSubtask = () => {
    const newSubtask = { 
      id: `st${subtasks.length + 1}`, 
      title: 'New subtask', 
      completed: false 
    };
    setSubtasks([...subtasks, newSubtask]);
    toast.success("Subtask added");
  };

  const handleSaveChanges = () => {
    if (task) {
      const updatedTask = {
        ...task,
        title: taskTitle,
        description: taskDescription
      };
      onTaskUpdate(updatedTask);
      toast.success("Task updated successfully");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return 'bg-slate-100 text-slate-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'In Review':
        return 'bg-purple-100 text-purple-800';
      case 'Done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Input 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.target.value)}
              className="text-xl font-semibold h-auto py-1 px-2 bg-transparent focus-visible:bg-background"
            />
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority} Priority
            </Badge>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
            <Badge variant="outline">
              <CalendarIcon className="h-3 w-3 mr-1" /> 
              {task.dueDate}
            </Badge>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={taskDescription} 
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Add a detailed description..."
                  className="mt-1"
                  rows={5}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Assignee</label>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {task.assignee}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assignee === 'JD' ? 'John Doe' : 
                         task.assignee === 'AS' ? 'Alice Smith' :
                         task.assignee === 'RM' ? 'Robert Miller' :
                         task.assignee === 'JW' ? 'Jane Wilson' :
                         task.assignee === 'TW' ? 'Thomas Wright' : task.assignee}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {task.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6 text-xs">
                    + Add Tag
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">Time Estimate</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>4 hours</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium">Time Logged</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>2.5 hours</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Dependencies</label>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Design Requirements (Blocked by)</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <LinkIcon className="h-3 w-3 mr-1" /> Add Dependency
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="subtasks" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Subtasks</h4>
                <Button size="sm" variant="outline" onClick={addSubtask}>Add Subtask</Button>
              </div>
              
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Checkbox 
                      id={subtask.id} 
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                    />
                    <label
                      htmlFor={subtask.id}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        subtask.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {subtask.title}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <h4 className="text-sm font-medium">Progress</h4>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${(subtasks.filter(st => st.completed).length / subtasks.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {subtasks.filter(st => st.completed).length} of {subtasks.length} subtasks completed
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="comments" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Comments ({comments.length})</h4>
              </div>
              
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {comment.author}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{comment.fullName}</h5>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea 
                    placeholder="Add a comment..." 
                    className="min-h-[60px]"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button variant="default" size="icon" onClick={handleAddComment}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
                <Button variant="outline" size="sm">
                  <Paperclip className="h-3 w-3 mr-1" /> Add File
                </Button>
              </div>
              
              <div className="space-y-2">
                {attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.size} • Uploaded by {file.uploadedBy} • {file.timestamp}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="mt-6">
          <Separator className="my-4" />
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailsPanel;
