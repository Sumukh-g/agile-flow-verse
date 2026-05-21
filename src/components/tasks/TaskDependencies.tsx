/**
 * Task Dependencies Component
 * 
 * Manages task dependencies with visual indicators and cycle prevention.
 * 
 * Features:
 * - View existing dependencies (blocks/blocked by)
 * - Add new dependencies with task search
 * - Remove dependencies
 * - Cycle detection (prevents circular dependencies)
 * - Visual status indicators
 * 
 * @param taskId - ID of the current task
 * @param projectId - Optional project ID for filtering available tasks
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { 
  Link2, 
  Unlink, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';

interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  from: {
    id: string;
    title: string;
    status: string;
  };
  to: {
    id: string;
    title: string;
    status: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TaskDependenciesProps {
  taskId: string;
  projectId?: string;
  onDependencyChange?: () => void;
}

export function TaskDependencies({ taskId, projectId, onDependencyChange }: TaskDependenciesProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [dependencyType, setDependencyType] = useState<'blocks' | 'blockedBy'>('blocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Fetch current task's dependencies
  const { data: dependencies, isLoading, refetch } = useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/tasks/${taskId}/dependencies`);
      return response.data as {
        blockedBy: TaskDependency[];
        blocks: TaskDependency[];
      };
    },
  });

  // Fetch available tasks for adding dependencies
  const { data: availableTasks } = useQuery({
    queryKey: ['tasks-for-dependency', projectId, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '20');
      
      const response = await apiClient.get(`/v1/tasks?${params.toString()}`);
      // Filter out the current task
      const tasks = (response.data?.items || []).filter((t: Task) => t.id !== taskId);
      return tasks as Task[];
    },
    enabled: isAddOpen,
  });

  // Add dependency mutation
  const addDependency = useMutation({
    mutationFn: async ({ fromTaskId, toTaskId }: { fromTaskId: string; toTaskId: string }) => {
      return apiClient.post('/v1/tasks/dependencies', { fromTaskId, toTaskId });
    },
    onSuccess: () => {
      toast.success('Dependency added successfully');
      setIsAddOpen(false);
      setSelectedTaskId('');
      refetch();
      onDependencyChange?.();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add dependency';
      toast.error(message);
    },
  });

  // Remove dependency mutation
  const removeDependency = useMutation({
    mutationFn: async (dependencyId: string) => {
      return apiClient.delete(`/v1/tasks/dependencies/${dependencyId}`);
    },
    onSuccess: () => {
      toast.success('Dependency removed');
      refetch();
      onDependencyChange?.();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      toast.error('Failed to remove dependency');
    },
  });

  const handleAddDependency = () => {
    if (!selectedTaskId) {
      toast.error('Please select a task');
      return;
    }

    // Determine from/to based on dependency type
    const fromTaskId = dependencyType === 'blocks' ? taskId : selectedTaskId;
    const toTaskId = dependencyType === 'blocks' ? selectedTaskId : taskId;

    addDependency.mutate({ fromTaskId, toTaskId });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
      case 'in progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const isComplete = ['done', 'completed'].includes(status.toLowerCase());
    return (
      <Badge variant={isComplete ? 'default' : 'secondary'} className={isComplete ? 'bg-green-500' : ''}>
        {status}
      </Badge>
    );
  };

  const blockedBy = dependencies?.blockedBy || [];
  const blocks = dependencies?.blocks || [];
  const hasUnresolvedBlockers = blockedBy.some(
    dep => !['done', 'completed'].includes(dep.from.status.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading dependencies...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Dependencies
              {hasUnresolvedBlockers && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Blocked
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage task relationships and blockers
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Dependency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Dependency</DialogTitle>
                <DialogDescription>
                  Create a relationship between tasks
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Dependency Type Selection */}
                <div className="space-y-2">
                  <Label>Dependency Type</Label>
                  <Select value={dependencyType} onValueChange={(v) => setDependencyType(v as 'blocks' | 'blockedBy')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocks">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          This task blocks...
                        </div>
                      </SelectItem>
                      <SelectItem value="blockedBy">
                        <div className="flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          This task is blocked by...
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Search */}
                <div className="space-y-2">
                  <Label>Search Task</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Task Selection */}
                <div className="space-y-2">
                  <Label>Select Task</Label>
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a task..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks?.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <span className="truncate max-w-[200px]">{task.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {(!availableTasks || availableTasks.length === 0) && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No tasks found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Warning about cycles */}
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Circular dependencies are automatically detected and prevented.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddDependency}
                    disabled={!selectedTaskId || addDependency.isPending}
                  >
                    {addDependency.isPending ? 'Adding...' : 'Add Dependency'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Blocked By Section */}
        {blockedBy.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Blocked By ({blockedBy.length})
            </div>
            <div className="space-y-2">
              {blockedBy.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(dep.from.status)}
                    <span className="font-medium">{dep.from.title}</span>
                    {getStatusBadge(dep.from.status)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDependency.mutate(dep.id)}
                    disabled={removeDependency.isPending}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocks Section */}
        {blocks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Blocks ({blocks.length})
            </div>
            <div className="space-y-2">
              {blocks.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(dep.to.status)}
                    <span className="font-medium">{dep.to.title}</span>
                    {getStatusBadge(dep.to.status)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDependency.mutate(dep.id)}
                    disabled={removeDependency.isPending}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {blockedBy.length === 0 && blocks.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No dependencies yet</p>
            <p className="text-xs">Add dependencies to track task relationships</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

