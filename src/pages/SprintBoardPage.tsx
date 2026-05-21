/**
 * Sprint Board Page
 * 
 * Active sprint view with:
 * - Sprint overview with progress metrics
 * - Burndown chart visualization
 * - Kanban-style task board
 * - Sprint controls (complete, cancel)
 * - Retrospective notes
 * 
 * Performance optimized with memoized components.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flag,
  Flame,
  Layers,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
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
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import {
  useActiveSprint,
  useSprint,
  useSprintBurndown,
  useCompleteSprint,
  Sprint
} from '@/hooks/useSprints';
import { useProjects } from '@/hooks/useProjects';
import { useScopeCreep, useSprintRiskAnalysis } from '@/hooks/useAiSprint';
import { DoDPanel } from '@/components/scrum/DoDPanel';
import { SprintReviewTab } from '@/components/scrum/SprintReviewTab';
import { CapacityPlanner } from '@/components/scrum/CapacityPlanner';
import { RetroInsightsPanel } from '@/components/ai/RetroInsightsPanel';

// ============================================
// TYPES
// ============================================

interface SprintItem {
  id: string;
  title: string;
  status: string;
  storyPoints?: number;
  priority: string;
  epic?: { id: string; name: string; color: string };
  sprint?: { id: string; name: string; status: string };
}

// ============================================
// STATUS COLUMNS
// ============================================

const STATUS_COLUMNS = [
  { id: 'todo', name: 'To Do', color: '#6b7280' },
  { id: 'working', name: 'In Progress', color: '#f59e42' },
  { id: 'review', name: 'Review', color: '#8b5cf6' },
  { id: 'done', name: 'Done', color: '#22c55e' }
];

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'border-l-emerald-500',
  Medium: 'border-l-amber-500',
  High: 'border-l-orange-500',
  Critical: 'border-l-red-500',
  low: 'border-l-emerald-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500'
};

// ============================================
// BURNDOWN CHART COMPONENT
// ============================================

interface BurndownChartProps {
  data: Array<{
    date: string;
    ideal: number;
    actual?: number;
  }>;
  totalPoints: number;
}

const BurndownChart: React.FC<BurndownChartProps> = ({ data, totalPoints }) => {
  const chartData = useMemo(() => {
    // Fill in actual values with last known value for display
    let lastActual: number | undefined;
    return data.map(point => {
      if (point.actual !== undefined) {
        lastActual = point.actual;
      }
      return {
        ...point,
        actual: lastActual
      };
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="idealGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(new Date(value), 'MMM d')}
          className="text-xs"
        />
        <YAxis domain={[0, Math.max(totalPoints, 1)]} />
        <Tooltip
          labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
          formatter={(value: number, name: string) => [
            `${value} pts`,
            name === 'ideal' ? 'Ideal' : 'Actual'
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
        <Area
          type="monotone"
          dataKey="ideal"
          stroke="#94a3b8"
          fill="url(#idealGradient)"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Ideal"
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#6366f1"
          fill="url(#actualGradient)"
          strokeWidth={2}
          name="Actual"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ============================================
// SPRINT ITEM CARD COMPONENT
// ============================================

interface SprintItemCardProps {
  item: SprintItem;
}

const SprintItemCard: React.FC<SprintItemCardProps> = ({ item }) => {
  return (
    <div
      className={`
        p-3 rounded-lg bg-background border-l-4 shadow-sm
        hover:shadow-md transition-shadow cursor-pointer
        ${PRIORITY_COLORS[item.priority] || 'border-l-gray-300'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          {item.epic && (
            <div className="flex items-center gap-1 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.epic.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {item.epic.name}
              </span>
            </div>
          )}
        </div>
        {item.storyPoints !== undefined && item.storyPoints > 0 && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {item.storyPoints}
          </Badge>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPLETE SPRINT DIALOG
// ============================================

interface CompleteSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint;
  onComplete: (retrospective: {
    wentWell?: string;
    needsImprovement?: string;
    actionItems?: string;
  }) => void;
  isLoading: boolean;
}

const CompleteSprintDialog: React.FC<CompleteSprintDialogProps> = ({
  open,
  onOpenChange,
  sprint,
  onComplete,
  isLoading
}) => {
  const [wentWell, setWentWell] = useState('');
  const [needsImprovement, setNeedsImprovement] = useState('');
  const [actionItems, setActionItems] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      wentWell: wentWell || undefined,
      needsImprovement: needsImprovement || undefined,
      actionItems: actionItems || undefined
    });
  };

  const completedItems = sprint.kanbanCards?.filter(c => c.status === 'done').length || 0;
  const totalItems = sprint.kanbanCards?.length || 0;
  const incompleteItems = totalItems - completedItems;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Complete Sprint: {sprint.name}
          </DialogTitle>
          <DialogDescription>
            Review the sprint and capture retrospective notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sprint summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{completedItems}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{incompleteItems}</p>
              <p className="text-xs text-muted-foreground">Incomplete</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {sprint.metrics?.completedPoints || 0}
              </p>
              <p className="text-xs text-muted-foreground">Points Done</p>
            </div>
          </div>

          {incompleteItems > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4" />
              {incompleteItems} incomplete items will be moved back to the backlog.
            </div>
          )}

          {/* AI Retro Insights */}
          <RetroInsightsPanel
            sprintId={sprint.id}
            onApply={(insights) => {
              if (insights.suggestedWentWell) setWentWell(insights.suggestedWentWell);
              if (insights.suggestedNeedsImprovement) setNeedsImprovement(insights.suggestedNeedsImprovement);
              if (insights.recommendedActionItems.length > 0) setActionItems(insights.recommendedActionItems.join('\n'));
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="wentWell">What went well?</Label>
            <Textarea
              id="wentWell"
              placeholder="Celebrate successes..."
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="needsImprovement">What needs improvement?</Label>
            <Textarea
              id="needsImprovement"
              placeholder="Areas to focus on..."
              value={needsImprovement}
              onChange={(e) => setNeedsImprovement(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionItems">Action items for next sprint</Label>
            <Textarea
              id="actionItems"
              placeholder="Concrete steps to improve..."
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Completing...' : 'Complete Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// MAIN SPRINT BOARD PAGE COMPONENT
// ============================================

const SprintBoardPage: React.FC = () => {
  const { projectId, sprintId } = useParams<{ projectId: string; sprintId?: string }>();
  const navigate = useNavigate();
  
  // Get projects first to enable project selection
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  // Use the first project if none is specified
  const resolvedProjectId = projectId || projects?.[0]?.id || '';

  // State
  const [activeTab, setActiveTab] = useState<'board' | 'burndown' | 'review'>('board');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDoDPanel, setShowDoDPanel] = useState<string | null>(null);

  // Queries - use specific sprint if provided, otherwise get active sprint
  const { data: activeSprint, isLoading: activeLoading } = useActiveSprint(resolvedProjectId);
  const { data: specificSprint, isLoading: specificLoading } = useSprint(sprintId || '');
  
  const sprint = sprintId ? specificSprint : activeSprint;
  const isLoading = sprintId ? specificLoading : activeLoading;

  const { data: burndownData } = useSprintBurndown(sprint?.id || '');

  // Mutations
  const completeSprint = useCompleteSprint();

  const { data: scopeCreepData } = useScopeCreep(sprint?.status === 'ACTIVE' ? sprint?.id : undefined);
  const { data: riskData } = useSprintRiskAnalysis(sprint?.status === 'ACTIVE' ? sprint?.id : undefined);

  const currentProject = projects?.find(p => p.id === resolvedProjectId);

  // Group items by status
  const itemsByStatus = useMemo(() => {
    const groups: Record<string, SprintItem[]> = {};
    STATUS_COLUMNS.forEach(col => {
      groups[col.id] = [];
    });

    if (sprint?.kanbanCards) {
      for (const card of sprint.kanbanCards as SprintItem[]) {
        const status = card.status || 'todo';
        const normalizedStatus = status === 'in_progress' ? 'working' : status;
        if (groups[normalizedStatus]) {
          groups[normalizedStatus].push(card);
        } else {
          groups.todo.push(card);
        }
      }
    }

    return groups;
  }, [sprint]);

  // Calculate sprint progress
  const sprintProgress = useMemo(() => {
    if (!sprint) return { percentage: 0, daysRemaining: 0, hoursRemaining: 0 };
    
    const now = new Date();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    const daysRemaining = differenceInDays(end, now);
    const hoursRemaining = differenceInHours(end, now) % 24;

    return { percentage, daysRemaining, hoursRemaining };
  }, [sprint]);

  // Handlers
  const handleCompleteSprint = useCallback(async (retrospective: {
    wentWell?: string;
    needsImprovement?: string;
    actionItems?: string;
  }) => {
    if (!sprint) return;
    
    try {
      await completeSprint.mutateAsync({
        id: sprint.id,
        ...retrospective
      });
      toast.success('Sprint completed! 🎉');
      setShowCompleteDialog(false);
      navigate(`/projects/${resolvedProjectId}/backlog`);
    } catch (error) {
      toast.error('Failed to complete sprint');
    }
  }, [completeSprint, sprint, navigate, resolvedProjectId]);

  // Show loading state
  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show message if no projects exist
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <Layers className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Projects Available</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Create a project first to start tracking sprints.
        </p>
        <Button onClick={() => navigate('/projects')}>
          <Layers className="h-4 w-4 mr-2" />
          Go to Projects
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading sprint...</div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <PauseCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Sprint</h2>
        <p className="text-muted-foreground mb-4">
          Start a sprint from the backlog to see it here.
        </p>
        <Button onClick={() => navigate('/backlog')}>
          <Layers className="h-4 w-4 mr-2" />
          Go to Backlog
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${resolvedProjectId}/backlog`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Backlog
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{sprint.name}</h1>
              <Badge variant="default" className="bg-green-500">
                {sprint.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentProject?.name} • {format(new Date(sprint.startDate), 'MMM d')} - {format(new Date(sprint.endDate), 'MMM d')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Sprint
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                Cancel Sprint
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowCompleteDialog(true)}>
            <Trophy className="h-4 w-4 mr-2" />
            Complete Sprint
          </Button>
        </div>
      </div>

      {/* Sprint Goal Banner */}
      {sprint.goal && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b flex items-center gap-3">
          <Target className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Sprint Goal</span>
            <p className="text-sm font-medium">{sprint.goal}</p>
          </div>
        </div>
      )}

      {/* AI Risk Alert Banner */}
      {riskData && riskData.riskLevel !== 'on_track' && riskData.riskLevel !== 'unknown' && (
        <div className={`px-4 py-2.5 border-b flex items-start gap-3 ${
          riskData.riskLevel === 'critical' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30'
        }`}>
          <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
            riskData.riskLevel === 'critical' ? 'text-red-600' : 'text-amber-600'
          }`} />
          <div className="flex-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${
              riskData.riskLevel === 'critical' ? 'text-red-600' : 'text-amber-600'
            }`}>Sprint {riskData.riskLevel === 'critical' ? 'Critical' : 'At Risk'}</span>
            <p className="text-sm">{riskData.risks[0]}</p>
            {riskData.suggestions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{riskData.suggestions[0]}</p>
            )}
          </div>
        </div>
      )}

      {/* Scope Creep Indicator */}
      {scopeCreepData && scopeCreepData.scopeChanges > 0 && (
        <div className="px-4 py-1.5 border-b bg-orange-50 dark:bg-orange-950/30 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-xs text-orange-700 dark:text-orange-300">
            Scope creep: +{scopeCreepData.scopeChanges} items ({scopeCreepData.addedPoints} pts) added since sprint start ({scopeCreepData.creepPercentage}% increase)
          </span>
        </div>
      )}

      {/* Sprint stats */}
      <div className="grid grid-cols-5 gap-4 p-4 border-b">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Time Remaining</p>
                <p className="text-xl font-bold">
                  {sprintProgress.daysRemaining}d {sprintProgress.hoursRemaining}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <Progress value={sprintProgress.percentage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-xl font-bold">{sprint.metrics?.progress || 0}%</p>
              </div>
              <Target className="h-8 w-8 text-primary/30" />
            </div>
            <Progress value={sprint.metrics?.progress || 0} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-emerald-600">
                  {sprint.metrics?.completedPoints || 0} pts
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-amber-600">
                  {sprint.metrics?.inProgressPoints || 0} pts
                </p>
              </div>
              <Flame className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-muted-foreground">
                  {sprint.metrics?.remainingPoints || 0} pts
                </p>
              </div>
              <Layers className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sprint goal */}
      {sprint.goal && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <Flag className="h-4 w-4 text-primary" />
            <span className="font-medium">Sprint Goal:</span>
            <span className="text-muted-foreground">{sprint.goal}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 border-b">
          <TabsList>
            <TabsTrigger value="board">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </TabsTrigger>
            <TabsTrigger value="burndown">
              <TrendingDown className="h-4 w-4 mr-2" />
              Burndown
            </TabsTrigger>
            <TabsTrigger value="review">
              <Flag className="h-4 w-4 mr-2" />
              Review
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="board" className="flex-1 overflow-hidden mt-0">
          <div className="h-full flex gap-4 p-4 overflow-x-auto">
            {STATUS_COLUMNS.map(column => (
              <div key={column.id} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="font-medium text-sm">{column.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {itemsByStatus[column.id]?.length || 0}
                    </Badge>
                  </div>
                </div>
                
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-2 pr-2">
                    {itemsByStatus[column.id]?.map(item => (
                      <SprintItemCard key={item.id} item={item} />
                    ))}
                    {itemsByStatus[column.id]?.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No items
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="burndown" className="flex-1 p-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sprint Burndown</CardTitle>
              <CardDescription>
                Track remaining work against the ideal burndown line
              </CardDescription>
            </CardHeader>
            <CardContent>
              {burndownData ? (
                <BurndownChart
                  data={burndownData.data}
                  totalPoints={burndownData.totalPoints}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Loading burndown data...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="flex-1 overflow-auto mt-0">
          <SprintReviewTab sprint={sprint} />
        </TabsContent>
      </Tabs>

      {/* Complete Sprint Dialog */}
      {sprint && (
        <CompleteSprintDialog
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
          sprint={sprint}
          onComplete={handleCompleteSprint}
          isLoading={completeSprint.isPending}
        />
      )}
    </div>
  );
};

export default SprintBoardPage;

