/**
 * Backlog Page
 * 
 * Sprint planning view with:
 * - Product backlog with all unassigned items
 * - Sprint planning with drag-drop
 * - Story point estimation
 * - Epic grouping
 * - Velocity-based capacity planning
 * 
 * Performance optimized with virtualization for large backlogs.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays, addDays } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  GripVertical,
  Layers,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import {
  useBacklog,
  useSprints,
  useActiveSprint,
  useVelocity,
  useCreateSprint,
  useStartSprint,
  useAddToSprint,
  useRemoveFromSprint,
  Sprint
} from '@/hooks/useSprints';
import { useEpics, Epic } from '@/hooks/useEpics';
import { useProjects } from '@/hooks/useProjects';
import { useEpicRiskSummary } from '@/hooks/useAiEpic';
import { SprintPlannerPanel } from '@/components/ai/SprintPlannerPanel';
import { CapacityPlanner } from '@/components/scrum/CapacityPlanner';
import { EpicRiskBadge } from '@/components/scrum/EpicRiskBadge';
import { EstimationSuggestion } from '@/components/ai/EstimationSuggestion';

// ============================================
// TYPES
// ============================================

interface BacklogItem {
  id: string;
  title: string;
  itemType: 'card' | 'task';
  status: string;
  storyPoints?: number;
  priority: string;
  isRefined?: boolean;
  acceptanceCriteria?: string;
  epic?: { id: string; name: string; color: string; riskLevel?: string; riskReason?: string };
}

// ============================================
// PRIORITY COLORS
// ============================================

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];

// ============================================
// BACKLOG ITEM COMPONENT
// ============================================

interface BacklogItemRowProps {
  item: BacklogItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (e: React.DragEvent, item: BacklogItem) => void;
}

const BacklogItemRow: React.FC<BacklogItemRowProps> = ({
  item,
  isSelected,
  onSelect,
  onDragStart
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onClick={() => onSelect(item.id)}
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
        transition-all duration-150 hover:bg-muted/50
        ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'}
      `}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      
      {/* Epic indicator */}
      {item.epic && (
        <div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: item.epic.color }}
          title={item.epic.name}
        />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        {item.epic && (
          <p className="text-xs text-muted-foreground truncate">{item.epic.name}</p>
        )}
      </div>

      <Badge variant="outline" className="text-[10px]">
        {item.itemType === 'task' ? 'Task' : 'Card'}
      </Badge>
      
      {/* Readiness indicators */}
      {!item.isRefined && (
        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
          Unrefined
        </Badge>
      )}
      {(item.storyPoints === undefined || item.storyPoints === null) && (
        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
          No Points
        </Badge>
      )}

      {/* Epic risk badge */}
      {item.epic && (item.epic as any).riskLevel && (
        <EpicRiskBadge riskLevel={(item.epic as any).riskLevel} riskReason={(item.epic as any).riskReason} />
      )}

      <Badge variant="outline" className={PRIORITY_COLORS[item.priority] || ''}>
        {item.priority}
      </Badge>
      
      {item.storyPoints !== undefined && item.storyPoints !== null && item.storyPoints > 0 && (
        <Badge variant="secondary" className="min-w-[24px] justify-center">
          {item.storyPoints}
        </Badge>
      )}
    </div>
  );
};

// ============================================
// SPRINT COLUMN COMPONENT
// ============================================

interface SprintColumnProps {
  sprint: Sprint;
  items: BacklogItem[];
  onDrop: (sprintId: string, items: BacklogItem[]) => void;
  onRemoveItem: (sprintId: string, itemId: string) => void;
  onStartSprint: () => void;
  averageVelocity: number;
}

const SprintColumn: React.FC<SprintColumnProps> = ({
  sprint,
  items,
  onDrop,
  onRemoveItem,
  onStartSprint,
  averageVelocity
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const totalPoints = items.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
  const capacityPercentage = averageVelocity > 0 ? (totalPoints / averageVelocity) * 100 : 0;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(sprint.id, [data]);
    } catch {
      // Invalid data
    }
  };
  
  const daysRemaining = sprint.status === 'ACTIVE'
    ? differenceInDays(new Date(sprint.endDate), new Date())
    : differenceInDays(new Date(sprint.endDate), new Date(sprint.startDate));

  return (
    <Card className={`flex-shrink-0 w-80 ${isDragOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{sprint.name}</CardTitle>
          <Badge
            variant={sprint.status === 'ACTIVE' ? 'default' : 'secondary'}
            className={sprint.status === 'ACTIVE' ? 'bg-green-500' : ''}
          >
            {sprint.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3" />
          {format(new Date(sprint.startDate), 'MMM d')} - {format(new Date(sprint.endDate), 'MMM d')}
          <span className="text-muted-foreground">({daysRemaining} days)</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Capacity indicator */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className={capacityPercentage > 100 ? 'text-red-500 font-medium' : ''}>
              {totalPoints} / {averageVelocity} pts ({Math.round(capacityPercentage)}%)
            </span>
          </div>
          <Progress 
            value={Math.min(capacityPercentage, 100)} 
            className={capacityPercentage > 100 ? 'bg-red-100' : ''}
          />
        </div>
        
        {sprint.goal && (
          <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
            <Target className="h-3 w-3 inline mr-1" />
            {sprint.goal}
          </div>
        )}
        
        {/* Items */}
        <ScrollArea
          className="h-64 rounded border border-dashed"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-2 space-y-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                <Layers className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Drag items here</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded bg-background border text-sm"
                >
                  {item.epic && (
                    <div
                      className="w-1 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.epic.color }}
                    />
                  )}
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.storyPoints && (
                    <Badge variant="secondary" className="text-xs">
                      {item.storyPoints}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveItem(sprint.id, item.id)}
                  >
                    ×
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Actions */}
        {sprint.status === 'PLANNING' && (
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={onStartSprint}
            disabled={items.length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Start Sprint
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// CREATE SPRINT DIALOG
// ============================================

interface CreateSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
  }) => void;
  isLoading: boolean;
}

const CreateSprintDialog: React.FC<CreateSprintDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, goal: goal || undefined, startDate, endDate });
    // Reset form
    setName('');
    setGoal('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
          <DialogDescription>
            Plan a new sprint with a goal and timeline.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sprint Name</Label>
            <Input
              id="name"
              placeholder="e.g., Sprint 12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goal">Sprint Goal (optional)</Label>
            <Textarea
              id="goal"
              placeholder="What do you want to achieve this sprint?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? 'Creating...' : 'Create Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// MAIN BACKLOG PAGE COMPONENT
// ============================================

const BacklogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Get projects first to enable project selection
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  // Use the first project if none is specified
  const resolvedProjectId = projectId || projects?.[0]?.id || '';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterEpic, setFilterEpic] = useState<string | null>(null);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  // Queries - only fetch if we have a valid projectId
  const { data: backlog, isLoading: backlogLoading } = useBacklog(resolvedProjectId);
  const { data: sprints, isLoading: sprintsLoading } = useSprints(resolvedProjectId, { includeCards: true });
  const { data: velocityData } = useVelocity(resolvedProjectId);
  const { data: epics } = useEpics(resolvedProjectId);
  
  // Mutations
  const createSprint = useCreateSprint();
  const startSprint = useStartSprint();
  const addToSprint = useAddToSprint();
  const removeFromSprint = useRemoveFromSprint();

  const currentProject = projects?.find(p => p.id === resolvedProjectId);
  const averageVelocity = velocityData?.averageVelocity || 30;

  // Filter backlog items
  const allBacklogItems = useMemo<BacklogItem[]>(() => {
    if (!backlog) return [];

    const cards: BacklogItem[] = (backlog.cards || []).map((card) => ({
      ...card,
      itemType: 'card',
    }));

    const tasks: BacklogItem[] = (backlog.tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      itemType: 'task',
      status: task.status || 'todo',
      storyPoints: undefined,
      priority: task.priority || 'medium',
      isRefined: true,
      acceptanceCriteria: undefined,
      epic: undefined,
    }));

    return [...cards, ...tasks];
  }, [backlog]);

  const filteredBacklog = useMemo(() => {
    let items = allBacklogItems;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query)
      );
    }
    
    if (filterEpic) {
      items = items.filter(item => item.epic?.id === filterEpic);
    }
    
    return items;
  }, [allBacklogItems, searchQuery, filterEpic]);

  // Group by epic
  const groupedByEpic = useMemo(() => {
    const groups: Record<string, BacklogItem[]> = { unassigned: [] };
    
    for (const item of filteredBacklog) {
      if (item.epic) {
        if (!groups[item.epic.id]) {
          groups[item.epic.id] = [];
        }
        groups[item.epic.id].push(item);
      } else {
        groups.unassigned.push(item);
      }
    }
    
    return groups;
  }, [filteredBacklog]);

  // Planning sprints (PLANNING status)
  const planningSprints = useMemo(() => {
    if (!sprints) return [];
    return sprints.filter(s => s.status === 'PLANNING');
  }, [sprints]);

  // Handlers
  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, item: BacklogItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDropToSprint = useCallback(async (sprintId: string, items: BacklogItem[]) => {
    try {
      const cardIds = items.filter((i) => i.itemType === 'card').map((i) => i.id);
      const taskIds = items.filter((i) => i.itemType === 'task').map((i) => i.id);

      if (cardIds.length > 0) {
        await addToSprint.mutateAsync({
          sprintId,
          itemIds: cardIds,
          itemType: 'card'
        });
      }

      if (taskIds.length > 0) {
        await addToSprint.mutateAsync({
          sprintId,
          itemIds: taskIds,
          itemType: 'task'
        });
      }

      toast.success(`Added ${items.length} item(s) to sprint`);
    } catch (error) {
      toast.error('Failed to add items to sprint');
    }
  }, [addToSprint]);

  const handleRemoveFromSprint = useCallback(async (sprintId: string, itemId: string) => {
    try {
      await removeFromSprint.mutateAsync({
        sprintId,
        itemIds: [itemId],
        itemType: 'card'
      });
      toast.success('Item removed from sprint');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  }, [removeFromSprint]);

  const handleCreateSprint = useCallback(async (data: {
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
  }) => {
    try {
      await createSprint.mutateAsync({
        projectId: resolvedProjectId,
        ...data
      });
      toast.success('Sprint created successfully');
      setShowCreateSprint(false);
    } catch (error) {
      toast.error('Failed to create sprint');
    }
  }, [createSprint, resolvedProjectId]);

  const handleStartSprint = useCallback(async (sprintId: string) => {
    try {
      await startSprint.mutateAsync(sprintId);
      toast.success('Sprint started!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start sprint');
    }
  }, [startSprint]);

  const toggleEpicExpand = useCallback((epicId: string) => {
    setExpandedEpics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  }, []);

  const addSelectedToSprint = useCallback(async (sprintId: string) => {
    if (selectedItems.size === 0) return;
    
    try {
      const selectedBacklogItems = allBacklogItems.filter((item) => selectedItems.has(item.id));
      const cardIds = selectedBacklogItems.filter((i) => i.itemType === 'card').map((i) => i.id);
      const taskIds = selectedBacklogItems.filter((i) => i.itemType === 'task').map((i) => i.id);

      if (cardIds.length > 0) {
        await addToSprint.mutateAsync({
          sprintId,
          itemIds: cardIds,
          itemType: 'card'
        });
      }

      if (taskIds.length > 0) {
        await addToSprint.mutateAsync({
          sprintId,
          itemIds: taskIds,
          itemType: 'task'
        });
      }

      toast.success(`Added ${selectedItems.size} item(s) to sprint`);
      setSelectedItems(new Set());
    } catch (error) {
      toast.error('Failed to add items to sprint');
    }
  }, [selectedItems, addToSprint, allBacklogItems]);

  // Show loading state
  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show project selector if no projects exist
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <Layers className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Projects Available</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Create a project first to start planning sprints and managing your backlog.
        </p>
        <Button onClick={() => navigate('/projects')}>
          <Plus className="h-4 w-4 mr-2" />
          Go to Projects
        </Button>
      </div>
    );
  }

  if (backlogLoading || sprintsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading backlog...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div>
          <h1 className="text-2xl font-bold">Backlog</h1>
          <p className="text-sm text-muted-foreground">
            {currentProject?.name || 'Project'} • {filteredBacklog.length} items • {backlog?.totalPoints || 0} story points
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search backlog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filterEpic ? 'Filtered' : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setFilterEpic(null)}>
                All Items
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {epics?.map(epic => (
                <DropdownMenuItem
                  key={epic.id}
                  onClick={() => setFilterEpic(epic.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: epic.color }}
                  />
                  {epic.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setShowCreateSprint(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Sprint
          </Button>
        </div>
      </div>

      {/* Velocity indicator */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="text-muted-foreground">Avg Velocity:</span>
          <span className="font-medium">{averageVelocity} pts/sprint</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground">Predicted Capacity:</span>
          <span className="font-medium">{velocityData?.predictedCapacity || Math.round(averageVelocity * 0.9)} pts</span>
        </div>
        {selectedItems.size > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="secondary">
              {selectedItems.size} selected
            </Badge>
            {planningSprints.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Add to Sprint
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {planningSprints.map(sprint => (
                    <DropdownMenuItem
                      key={sprint.id}
                      onClick={() => addSelectedToSprint(sprint.id)}
                    >
                      {sprint.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Backlog list */}
        <div className="w-1/2 border-r overflow-auto p-4">
          <div className="space-y-4">
            {/* Unassigned items */}
            {groupedByEpic.unassigned.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <LayoutList className="h-4 w-4" />
                  No Epic ({groupedByEpic.unassigned.length})
                </div>
                {groupedByEpic.unassigned.map(item => (
                  <BacklogItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onSelect={handleSelectItem}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            )}

            {/* Epic groups */}
            {epics?.map(epic => {
              const epicItems = groupedByEpic[epic.id] || [];
              if (epicItems.length === 0) return null;
              
              const isExpanded = expandedEpics.has(epic.id);
              const epicPoints = epicItems.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

              return (
                <div key={epic.id} className="space-y-2">
                  <button
                    onClick={() => toggleEpicExpand(epic.id)}
                    className="flex items-center gap-2 w-full text-left hover:bg-muted/50 p-2 rounded-lg"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: epic.color }}
                    />
                    <span className="font-medium">{epic.name}</span>
                    <EpicRiskBadge riskLevel={(epic as any).riskLevel} riskReason={(epic as any).riskReason} />
                    <Badge variant="outline" className="ml-auto">
                      {epicItems.length} items • {epicPoints} pts
                    </Badge>
                  </button>
                  
                  {isExpanded && epicItems.map(item => (
                    <BacklogItemRow
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.has(item.id)}
                      onSelect={handleSelectItem}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              );
            })}

            {filteredBacklog.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">Backlog is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Create tasks or cards on the Kanban board to populate the backlog.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sprint columns */}
        <div className="w-1/2 overflow-auto p-4 space-y-4">
          {/* AI Sprint Planning Panel */}
          {planningSprints.length > 0 && resolvedProjectId && (
            <SprintPlannerPanel
              sprintId={planningSprints[0].id}
              projectId={resolvedProjectId}
              onSelectItems={(ids) => {
                addToSprint.mutate({
                  sprintId: planningSprints[0].id,
                  itemIds: ids,
                  itemType: 'card',
                });
              }}
            />
          )}

          {/* Capacity Planner */}
          {planningSprints.length > 0 && (
            <CapacityPlanner sprintId={planningSprints[0].id} compact />
          )}

          <div className="flex gap-4 min-w-max">
            {planningSprints.length === 0 ? (
              <Card className="w-80">
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">No Sprints</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a sprint to start planning.
                  </p>
                  <Button onClick={() => setShowCreateSprint(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sprint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              planningSprints.map(sprint => (
                <SprintColumn
                  key={sprint.id}
                  sprint={sprint}
                  items={(sprint.kanbanCards || []) as BacklogItem[]}
                  onDrop={handleDropToSprint}
                  onRemoveItem={handleRemoveFromSprint}
                  onStartSprint={() => handleStartSprint(sprint.id)}
                  averageVelocity={averageVelocity}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        open={showCreateSprint}
        onOpenChange={setShowCreateSprint}
        onSubmit={handleCreateSprint}
        isLoading={createSprint.isPending}
      />
    </div>
  );
};

export default BacklogPage;

