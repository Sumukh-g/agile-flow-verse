/**
 * Epics Page
 * 
 * Epic management view with:
 * - Epic list with progress rollup
 * - Roadmap timeline view
 * - Epic details with child items
 * - Create/edit epic dialogs
 * 
 * Performance optimized with memoized components.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Flag,
  Layers,
  LayoutList,
  Map,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  useEpics,
  useEpic,
  useRoadmap,
  useCreateEpic,
  useUpdateEpic,
  useDeleteEpic,
  Epic
} from '@/hooks/useEpics';
import { useProjects } from '@/hooks/useProjects';
import { useEpicRiskSummary } from '@/hooks/useAiEpic';
import { EpicRiskBadge } from '@/components/scrum/EpicRiskBadge';
import { EpicDecomposer } from '@/components/ai/EpicDecomposer';

// ============================================
// CONSTANTS
// ============================================

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  open: { bg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  done: { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

// ============================================
// EPIC CARD COMPONENT
// ============================================

interface EpicCardProps {
  epic: Epic;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const EpicCard: React.FC<EpicCardProps> = ({
  epic,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete
}) => {
  const statusStyle = STATUS_COLORS[epic.status] || STATUS_COLORS.open;
  const totalItems = epic._count?.kanbanCards || epic.metrics?.totalItems || 0;
  const completedItems = epic.metrics?.completedItems || 0;

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggleExpand}
      >
        {/* Color bar */}
        <div
          className="w-1.5 h-12 rounded-full shrink-0"
          style={{ backgroundColor: epic.color }}
        />

        {/* Expand icon */}
        <button className="shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{epic.name}</h3>
            <Badge className={statusStyle.badge}>{epic.status.replace('_', ' ')}</Badge>
            <EpicRiskBadge riskLevel={(epic as any).riskLevel} riskReason={(epic as any).riskReason} size="md" />
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {epic.description || 'No description'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-32">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{epic.progress}%</span>
            </div>
            <Progress value={epic.progress} className="h-2" />
          </div>

          <div className="text-center">
            <p className="text-lg font-bold">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Items</p>
          </div>

          <div className="text-center">
            <p className="text-lg font-bold">{epic.storyPoints || 0}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => e.stopPropagation()} asChild>
                <div>
                  <EpicDecomposer epicId={epic.id} epicName={epic.name} />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-muted/10">
          <div className="grid grid-cols-4 gap-4 py-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <Badge variant="outline">{epic.priority}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Start Date</p>
              <p className="text-sm font-medium">
                {epic.startDate ? format(new Date(epic.startDate), 'MMM d, yyyy') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Target Date</p>
              <p className="text-sm font-medium">
                {epic.targetDate ? format(new Date(epic.targetDate), 'MMM d, yyyy') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Business Value</p>
              <p className="text-sm font-medium">{epic.businessValue || 'Not set'}</p>
            </div>
          </div>

          {/* Child items preview */}
          {epic.kanbanCards && epic.kanbanCards.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Items ({epic.kanbanCards.length})</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {epic.kanbanCards.slice(0, 5).map((card: any) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-2 p-2 rounded bg-background border text-sm"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        card.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="flex-1 truncate">{card.title}</span>
                    {card.storyPoints && (
                      <Badge variant="secondary" className="text-xs">
                        {card.storyPoints}
                      </Badge>
                    )}
                  </div>
                ))}
                {epic.kanbanCards.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    + {epic.kanbanCards.length - 5} more items
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ============================================
// ROADMAP VIEW COMPONENT
// ============================================

interface RoadmapViewProps {
  epics: Epic[];
  quarters: Record<string, Epic[]>;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ epics, quarters }) => {
  const chartData = useMemo(() => {
    return epics.map(epic => ({
      name: epic.name.length > 15 ? epic.name.substring(0, 15) + '...' : epic.name,
      progress: epic.progress,
      remaining: 100 - epic.progress,
      color: epic.color
    }));
  }, [epics]);

  return (
    <div className="space-y-6">
      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Epic Progress Overview</CardTitle>
          <CardDescription>Progress across all active epics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === 'progress' ? 'Complete' : 'Remaining'
                ]}
              />
              <Bar dataKey="progress" stackId="a" fill="#22c55e" />
              <Bar dataKey="remaining" stackId="a" fill="#e5e7eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline by Quarter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Roadmap Timeline</CardTitle>
          <CardDescription>Epics organized by target quarter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(quarters).map(([quarter, quarterEpics]) => (
              <div key={quarter}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">{quarter}</h4>
                  <Badge variant="secondary">{quarterEpics.length} epics</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                  {quarterEpics.map(epic => (
                    <div
                      key={epic.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-background"
                    >
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: epic.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{epic.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={epic.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{epic.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(quarters).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Map className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No epics with target dates to display on roadmap</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================
// CREATE/EDIT EPIC DIALOG
// ============================================

interface EpicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  epic?: Epic | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    color: string;
    priority: string;
    startDate?: string;
    targetDate?: string;
    businessValue?: number;
  }) => void;
  isLoading: boolean;
}

const EpicDialog: React.FC<EpicDialogProps> = ({
  open,
  onOpenChange,
  epic,
  onSubmit,
  isLoading
}) => {
  const [name, setName] = useState(epic?.name || '');
  const [description, setDescription] = useState(epic?.description || '');
  const [color, setColor] = useState(epic?.color || COLOR_OPTIONS[0]);
  const [priority, setPriority] = useState(epic?.priority || 'medium');
  const [startDate, setStartDate] = useState(
    epic?.startDate ? format(new Date(epic.startDate), 'yyyy-MM-dd') : ''
  );
  const [targetDate, setTargetDate] = useState(
    epic?.targetDate ? format(new Date(epic.targetDate), 'yyyy-MM-dd') : ''
  );
  const [businessValue, setBusinessValue] = useState(epic?.businessValue?.toString() || '');

  // Reset form when dialog opens with different epic
  React.useEffect(() => {
    if (open) {
      setName(epic?.name || '');
      setDescription(epic?.description || '');
      setColor(epic?.color || COLOR_OPTIONS[0]);
      setPriority(epic?.priority || 'medium');
      setStartDate(epic?.startDate ? format(new Date(epic.startDate), 'yyyy-MM-dd') : '');
      setTargetDate(epic?.targetDate ? format(new Date(epic.targetDate), 'yyyy-MM-dd') : '');
      setBusinessValue(epic?.businessValue?.toString() || '');
    }
  }, [open, epic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      color,
      priority,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
      businessValue: businessValue ? parseInt(businessValue, 10) : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{epic ? 'Edit Epic' : 'Create New Epic'}</DialogTitle>
          <DialogDescription>
            Epics are large bodies of work that can be broken down into smaller stories.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., User Authentication System"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the epic..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessValue">Business Value (optional)</Label>
            <Input
              id="businessValue"
              type="number"
              min="0"
              placeholder="e.g., 100"
              value={businessValue}
              onChange={(e) => setBusinessValue(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? 'Saving...' : epic ? 'Save Changes' : 'Create Epic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// MAIN EPICS PAGE COMPONENT
// ============================================

const EpicsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Get projects first to enable project selection
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  // Use the first project if none is specified
  const resolvedProjectId = projectId || projects?.[0]?.id || '';

  // State
  const [activeTab, setActiveTab] = useState<'list' | 'roadmap'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showEpicDialog, setShowEpicDialog] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  // Queries - only fetch if we have a valid projectId
  const { data: epics, isLoading } = useEpics(resolvedProjectId, { includeItems: true });
  const { data: roadmapData } = useRoadmap(resolvedProjectId);
  const { data: riskSummary } = useEpicRiskSummary(resolvedProjectId);

  // Mutations
  const createEpic = useCreateEpic();
  const updateEpic = useUpdateEpic();
  const deleteEpic = useDeleteEpic();

  const currentProject = projects?.find(p => p.id === resolvedProjectId);

  // Filter epics
  const filteredEpics = useMemo(() => {
    if (!epics) return [];

    let result = epics;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    }

    if (filterStatus) {
      result = result.filter(e => e.status === filterStatus);
    }

    return result;
  }, [epics, searchQuery, filterStatus]);

  // Summary stats
  const stats = useMemo(() => {
    if (!epics) return { total: 0, open: 0, inProgress: 0, done: 0, totalPoints: 0 };

    return {
      total: epics.length,
      open: epics.filter(e => e.status === 'open').length,
      inProgress: epics.filter(e => e.status === 'in_progress').length,
      done: epics.filter(e => e.status === 'done').length,
      totalPoints: epics.reduce((sum, e) => sum + (e.storyPoints || 0), 0)
    };
  }, [epics]);

  // Handlers
  const handleCreateEpic = useCallback(async (data: any) => {
    try {
      await createEpic.mutateAsync({
        projectId: resolvedProjectId,
        ...data
      });
      toast.success('Epic created successfully');
      setShowEpicDialog(false);
    } catch (error) {
      toast.error('Failed to create epic');
    }
  }, [createEpic, resolvedProjectId]);

  const handleUpdateEpic = useCallback(async (data: any) => {
    if (!editingEpic) return;

    try {
      await updateEpic.mutateAsync({
        id: editingEpic.id,
        ...data
      });
      toast.success('Epic updated successfully');
      setEditingEpic(null);
    } catch (error) {
      toast.error('Failed to update epic');
    }
  }, [updateEpic, editingEpic]);

  const handleDeleteEpic = useCallback(async (epic: Epic) => {
    if (!confirm(`Are you sure you want to delete "${epic.name}"?`)) return;

    try {
      await deleteEpic.mutateAsync({
        id: epic.id,
        projectId: resolvedProjectId
      });
      toast.success('Epic deleted');
    } catch (error) {
      toast.error('Failed to delete epic');
    }
  }, [deleteEpic, resolvedProjectId]);

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
          Create a project first to start organizing work into epics.
        </p>
        <Button onClick={() => navigate('/projects')}>
          <Plus className="h-4 w-4 mr-2" />
          Go to Projects
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading epics...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold">Epics</h1>
          <p className="text-sm text-muted-foreground">
            {currentProject?.name || 'Project'} • {stats.total} epics • {stats.totalPoints} story points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search epics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? null : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setShowEpicDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Epic
          </Button>
        </div>
      </div>

      {/* Stats bar with health dashboard */}
      <div className="flex items-center gap-6 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <span className="text-sm text-muted-foreground">Open:</span>
          <span className="font-medium">{stats.open}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-muted-foreground">In Progress:</span>
          <span className="font-medium">{stats.inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-muted-foreground">Done:</span>
          <span className="font-medium">{stats.done}</span>
        </div>
        {riskSummary && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm text-muted-foreground">On Track:</span>
              <span className="font-medium text-green-600">{riskSummary.onTrack}</span>
            </div>
            {riskSummary.atRisk > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-sm text-muted-foreground">At Risk:</span>
                <span className="font-medium text-amber-600">{riskSummary.atRisk}</span>
              </div>
            )}
            {riskSummary.critical > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                <span className="text-sm text-muted-foreground">Critical:</span>
                <span className="font-medium text-red-600">{riskSummary.critical}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 border-b">
          <TabsList>
            <TabsTrigger value="list">
              <LayoutList className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="roadmap">
              <Map className="h-4 w-4 mr-2" />
              Roadmap
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="flex-1 overflow-auto p-4 mt-0">
          <div className="space-y-3 max-w-5xl">
            {filteredEpics.map(epic => (
              <EpicCard
                key={epic.id}
                epic={epic}
                isExpanded={expandedEpics.has(epic.id)}
                onToggleExpand={() => toggleEpicExpand(epic.id)}
                onEdit={() => setEditingEpic(epic)}
                onDelete={() => handleDeleteEpic(epic)}
              />
            ))}

            {filteredEpics.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No Epics Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || filterStatus
                    ? 'Try adjusting your filters'
                    : 'Create your first epic to organize work'}
                </p>
                {!searchQuery && !filterStatus && (
                  <Button onClick={() => setShowEpicDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Epic
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="flex-1 overflow-auto p-4 mt-0">
          {roadmapData ? (
            <RoadmapView
              epics={roadmapData.epics}
              quarters={roadmapData.quarters}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Loading roadmap...
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Epic Dialog */}
      <EpicDialog
        open={showEpicDialog}
        onOpenChange={setShowEpicDialog}
        onSubmit={handleCreateEpic}
        isLoading={createEpic.isPending}
      />

      {/* Edit Epic Dialog */}
      <EpicDialog
        open={!!editingEpic}
        onOpenChange={(open) => !open && setEditingEpic(null)}
        epic={editingEpic}
        onSubmit={handleUpdateEpic}
        isLoading={updateEpic.isPending}
      />
    </div>
  );
};

export default EpicsPage;

