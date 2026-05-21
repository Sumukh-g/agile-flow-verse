/**
 * Task Details Panel Component
 * 
 * A comprehensive side panel for viewing and editing task details.
 * 
 * Features:
 * - View and edit task title/description
 * - Display status, priority, due date, and assignee
 * - Time tracking with start/stop timer
 * - Time logs list with manual entry support
 * - Subtasks management with progress indicator
 * - Task dependencies management
 * - Custom fields display and editing
 * - Comments section (integrated from API)
 * - File attachments management
 * 
 * The panel uses Sheet component for slide-in effect from right side.
 * All sections use real API data instead of mock data.
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  Clock, 
  FileText, 
  LinkIcon, 
  Paperclip, 
  Send, 
  ListChecks,
  Settings,
  GitBranch,
  Timer
} from "lucide-react";
import { toast } from "sonner";

// Import real task feature components
import { TaskTimer } from './TaskTimer';
import { TaskSubtasks } from './TaskSubtasks';
import { TaskTimeLogs } from './TaskTimeLogs';
import { TaskDependencies } from './TaskDependencies';
import { TaskCustomFields } from './TaskCustomFields';

// Import hooks for real data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

/**
 * Task interface matching the API task model
 */
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  status: string;
  projectId?: string;
  estimatedHours?: number;
  actualHours?: number;
  customFields?: Record<string, any>;
}

/**
 * Comment interface for task comments
 */
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Attachment interface for file attachments
 */
interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
  uploadedBy: {
    name: string;
  };
}

interface TaskDetailsPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (task: Task) => void;
}

/**
 * TaskDetailsPanel Component
 * 
 * Main component that renders the task details in a side panel.
 * Uses tabs to organize different sections: Details, Subtasks, Time, Dependencies, Comments, Files
 */
const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({ 
  task, 
  isOpen, 
  onClose,
  onTaskUpdate
}) => {
  // State for active tab and form inputs
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [taskTitle, setTaskTitle] = useState(task?.title || '');
  const [taskDescription, setTaskDescription] = useState(task?.description || '');

  const queryClient = useQueryClient();

  // Sync local state when task prop changes
  useEffect(() => {
    if (task) {
      setTaskTitle(task.title);
      setTaskDescription(task.description || '');
    }
  }, [task]);

  /**
   * Fetch comments for the task from the API
   * Returns empty array if no task is selected
   */
  const { data: comments = [], refetch: refetchComments } = useQuery<Comment[]>({
    queryKey: ['task-comments', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      try {
        const response = await apiClient.get(`/v1/comments?taskId=${task.id}`);
        return response.data?.items || response.data || [];
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        return [];
      }
    },
    enabled: !!task?.id,
  });

  /**
   * Fetch attachments for the task from the API
   */
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['task-attachments', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      try {
        const response = await apiClient.get(`/v1/attachments?taskId=${task.id}`);
        return response.data?.items || response.data || [];
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
        return [];
      }
    },
    enabled: !!task?.id,
  });

  /**
   * Mutation to add a new comment
   */
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post('/v1/comments', {
        content,
        taskId: task?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] });
      setCommentText('');
      toast.success("Comment added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    },
  });

  // Early return if no task is selected
  if (!task) return null;

  /**
   * Handle adding a new comment
   */
  const handleAddComment = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText.trim());
    }
  };

  /**
   * Handle saving task changes (title, description)
   * Calls the parent onTaskUpdate callback with updated task data
   */
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

  /**
   * Handle custom field changes
   * Updates task with new custom field values
   */
  const handleCustomFieldChange = (fieldId: string, value: any) => {
    if (task) {
      const updatedTask = {
        ...task,
        customFields: {
          ...(task.customFields || {}),
          [fieldId]: value,
        },
      };
      onTaskUpdate(updatedTask);
    }
  };

  /**
   * Get background color class for priority badge
   */
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  /**
   * Get background color class for status badge
   */
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'todo':
      case 'to do':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review':
      case 'in review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto">
        {/* Task Title - Editable Input */}
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
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority} Priority
            </Badge>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
            {task.dueDate && (
              <Badge variant="outline">
                <CalendarIcon className="h-3 w-3 mr-1" /> 
                {formatDate(task.dueDate)}
              </Badge>
            )}
          </div>
          
          {/* Tabbed Content Area */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="details" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Details
              </TabsTrigger>
              <TabsTrigger value="subtasks" className="text-xs">
                <ListChecks className="h-3 w-3 mr-1" />
                Subtasks
              </TabsTrigger>
              <TabsTrigger value="time" className="text-xs">
                <Timer className="h-3 w-3 mr-1" />
                Time
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="text-xs">
                <GitBranch className="h-3 w-3 mr-1" />
                Deps
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs">
                <Send className="h-3 w-3 mr-1" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="files" className="text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                Files
              </TabsTrigger>
            </TabsList>
            
            {/* Details Tab - Basic task info */}
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
                      {task.assignee?.slice(0, 2).toUpperCase() || 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assignee || 'Unassigned'}</span>
                </div>
              </div>
              
              {/* Tags Section */}
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {task.tags?.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6 text-xs">
                    + Add Tag
                  </Button>
                </div>
              </div>
              
              {/* Time Estimate Display */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">Time Estimate</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{task.estimatedHours || 0} hours</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium">Time Logged</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{task.actualHours || 0} hours</span>
                  </div>
                </div>
              </div>

              {/* Custom Fields Section - Inline in Details tab */}
              <div className="pt-4 border-t">
                <TaskCustomFields
                  taskId={task.id}
                  customFields={task.customFields || {}}
                  onFieldChange={handleCustomFieldChange}
                />
              </div>
            </TabsContent>
            
            {/* Subtasks Tab - Real component */}
            <TabsContent value="subtasks" className="space-y-4 mt-4">
              <TaskSubtasks 
                taskId={task.id} 
                projectId={task.projectId}
                onSubtaskCreated={() => {
                  // Optionally refresh task data after subtask creation
                  queryClient.invalidateQueries({ queryKey: ['tasks'] });
                }}
              />
            </TabsContent>

            {/* Time Tracking Tab - Real components */}
            <TabsContent value="time" className="space-y-4 mt-4">
              <TaskTimer taskId={task.id} taskTitle={task.title} />
              <TaskTimeLogs taskId={task.id} />
            </TabsContent>

            {/* Dependencies Tab - Real component */}
            <TabsContent value="dependencies" className="space-y-4 mt-4">
              <TaskDependencies taskId={task.id} projectId={task.projectId} />
            </TabsContent>
            
            {/* Comments Tab - API integrated */}
            <TabsContent value="comments" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Comments ({comments.length})</h4>
              </div>
              
              {/* Comments List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-accent/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {comment.user?.name?.slice(0, 2).toUpperCase() || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">{comment.user?.name || 'Unknown'}</h5>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Comment Form */}
              <div className="flex items-start gap-2 pt-2 border-t">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    ME
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea 
                    placeholder="Add a comment..." 
                    className="min-h-[60px]"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button 
                    variant="default" 
                    size="icon" 
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Files Tab - API integrated */}
            <TabsContent value="files" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
                <Button variant="outline" size="sm">
                  <Paperclip className="h-3 w-3 mr-1" /> Add File
                </Button>
              </div>
              
              {/* Attachments List */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No attachments yet. Upload files to share with your team.
                  </div>
                ) : (
                  attachments.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • Uploaded by {file.uploadedBy?.name || 'Unknown'} • {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer with Save/Cancel buttons */}
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
