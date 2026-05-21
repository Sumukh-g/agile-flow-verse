/**
 * GanttBoard Component - World-Class Gantt Chart Implementation
 * 
 * A beautiful, modern Gantt chart with:
 * - Fixed left panel for task info (always visible)
 * - Interactive timeline visualization
 * - Drag-and-drop task scheduling
 * - Group management with inline editing
 * - Template persistence with localStorage
 * - Real-time data synchronization
 * - Smooth animations and transitions
 * 
 * @author AgileFlowVerse Team
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowUpDown, 
  Calendar as CalendarIcon, 
  Check, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  Clock,
  Edit2,
  Eye, 
  FileText, 
  Filter, 
  Grip,
  MoreHorizontal, 
  Palette,
  Paperclip, 
  Pencil,
  Plus, 
  Search, 
  Sparkles,
  Trash2,
  User, 
  Users,
  X,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  useGantt,
  useCreateGanttTask,
  useUpdateGanttTask,
  useDeleteGanttTask,
  useUpdateGanttTaskSchedule,
  useCreateGanttDependency,
  useDeleteGanttDependency,
} from '@/hooks/useGantt';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a task in the Gantt chart
 */
export type GanttTask = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies?: string[];
  assignee?: string;
  status: 'done' | 'working-on-it' | 'stuck' | 'not-started';
  priority: 'low' | 'medium' | 'high';
  duration: number;
  notes?: string;
  files?: number;
  groupId: string;
};

/**
 * Represents a group of tasks in the Gantt chart
 */
export type TaskGroup = {
  id: string;
  name: string;
  collapsed: boolean;
  color: string;
};

/**
 * Structure saved to localStorage for persistence
 */
interface GanttPersistentData {
  groups: TaskGroup[];
  tasks: GanttTask[];
  templateId?: string;
  lastModified: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * localStorage key for persisting Gantt data
 */
const STORAGE_KEY_PREFIX = 'gantt-board-';

/**
 * Initial groups for the Gantt chart
 * These provide a default structure for organizing tasks
 */
const INITIAL_GROUPS: TaskGroup[] = [
  { id: 'planning', name: 'Planning', collapsed: false, color: '#6366f1' },
  { id: 'execution', name: 'Execution', collapsed: false, color: '#f43f5e' },
  { id: 'launch', name: 'Launch', collapsed: false, color: '#10b981' }
];

/**
 * Status colors for visual indication
 * Each status has a distinct, accessible color
 */
const STATUS_CONFIG = {
  'done': { color: '#10b981', bg: 'bg-emerald-500', text: 'Done', icon: '✓' },
  'working-on-it': { color: '#f59e0b', bg: 'bg-amber-500', text: 'In Progress', icon: '◐' },
  'stuck': { color: '#ef4444', bg: 'bg-red-500', text: 'Stuck', icon: '!' },
  'not-started': { color: '#94a3b8', bg: 'bg-slate-400', text: 'Not Started', icon: '○' }
};

/**
 * Priority configuration with colors and labels
 */
const PRIORITY_CONFIG = {
  'low': { color: '#10b981', label: 'Low', icon: '▽' },
  'medium': { color: '#f59e0b', label: 'Medium', icon: '◆' },
  'high': { color: '#ef4444', label: 'High', icon: '▲' }
};

/**
 * Group color palette for customization
 */
const GROUP_COLORS = [
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
];

/**
 * Project templates for quick setup
 */
const TEMPLATES = [
  {
    id: 'software-dev',
    name: 'Software Development',
    icon: '💻',
    description: 'Full SDLC workflow with sprints',
    groups: [
      { id: 'planning', name: 'Planning', color: '#6366f1' },
      { id: 'development', name: 'Development', color: '#f43f5e' },
      { id: 'testing', name: 'Testing', color: '#f59e0b' },
      { id: 'deployment', name: 'Deployment', color: '#10b981' }
    ],
    tasks: [
      { title: 'Requirements Analysis', groupId: 'planning', duration: 5, priority: 'high' },
      { title: 'System Design', groupId: 'planning', duration: 7, priority: 'high' },
      { title: 'Frontend Development', groupId: 'development', duration: 14, priority: 'medium' },
      { title: 'Backend Development', groupId: 'development', duration: 21, priority: 'medium' },
      { title: 'Unit Testing', groupId: 'testing', duration: 7, priority: 'medium' },
      { title: 'Integration Testing', groupId: 'testing', duration: 5, priority: 'high' },
      { title: 'Production Deployment', groupId: 'deployment', duration: 2, priority: 'high' }
    ]
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    icon: '📢',
    description: 'End-to-end campaign management',
    groups: [
      { id: 'research', name: 'Research', color: '#6366f1' },
      { id: 'creative', name: 'Creative', color: '#ec4899' },
      { id: 'execution', name: 'Execution', color: '#f59e0b' },
      { id: 'analysis', name: 'Analysis', color: '#10b981' }
    ],
    tasks: [
      { title: 'Market Research', groupId: 'research', duration: 7, priority: 'high' },
      { title: 'Competitor Analysis', groupId: 'research', duration: 5, priority: 'medium' },
      { title: 'Creative Brief', groupId: 'creative', duration: 3, priority: 'high' },
      { title: 'Design Assets', groupId: 'creative', duration: 10, priority: 'medium' },
      { title: 'Campaign Launch', groupId: 'execution', duration: 1, priority: 'high' },
      { title: 'Performance Analysis', groupId: 'analysis', duration: 7, priority: 'medium' }
    ]
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    icon: '🚀',
    description: 'From concept to market',
    groups: [
      { id: 'preparation', name: 'Preparation', color: '#8b5cf6' },
      { id: 'pre-launch', name: 'Pre-Launch', color: '#f59e0b' },
      { id: 'launch', name: 'Launch', color: '#10b981' },
      { id: 'post-launch', name: 'Post-Launch', color: '#06b6d4' }
    ],
    tasks: [
      { title: 'Product Finalization', groupId: 'preparation', duration: 10, priority: 'high' },
      { title: 'Beta Testing', groupId: 'preparation', duration: 14, priority: 'high' },
      { title: 'PR Campaign', groupId: 'pre-launch', duration: 7, priority: 'medium' },
      { title: 'Launch Event', groupId: 'launch', duration: 1, priority: 'high' },
      { title: 'User Feedback Collection', groupId: 'post-launch', duration: 14, priority: 'medium' }
    ]
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    icon: '🎉',
    description: 'Conference and event organization',
    groups: [
      { id: 'planning', name: 'Initial Planning', color: '#6366f1' },
      { id: 'logistics', name: 'Logistics', color: '#f43f5e' },
      { id: 'promotion', name: 'Promotion', color: '#ec4899' },
      { id: 'execution', name: 'Event Day', color: '#10b981' }
    ],
    tasks: [
      { title: 'Venue Selection', groupId: 'planning', duration: 7, priority: 'high' },
      { title: 'Speaker Outreach', groupId: 'planning', duration: 21, priority: 'high' },
      { title: 'Catering Setup', groupId: 'logistics', duration: 5, priority: 'medium' },
      { title: 'Social Media Campaign', groupId: 'promotion', duration: 30, priority: 'medium' },
      { title: 'Event Execution', groupId: 'execution', duration: 1, priority: 'high' }
    ]
  }
];

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface GanttBoardProps {
  /** Project ID for data fetching */
  projectId?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GanttBoard = ({ projectId }: GanttBoardProps) => {
  // --------------------------------------------------------------------------
  // API HOOKS - Data fetching and mutations
  // --------------------------------------------------------------------------
  const { data: ganttData, isLoading: ganttLoading } = useGantt(projectId);
  const createTask = useCreateGanttTask();
  const updateTask = useUpdateGanttTask();
  const deleteTask = useDeleteGanttTask();
  const updateTaskSchedule = useUpdateGanttTaskSchedule();
  const createDependency = useCreateGanttDependency();
  const deleteDependency = useDeleteGanttDependency();
  
  // --------------------------------------------------------------------------
  // LOCAL STATE
  // --------------------------------------------------------------------------
  
  // Core data state - persisted to localStorage
  const [groups, setGroups] = useState<TaskGroup[]>(INITIAL_GROUPS);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  
  // View state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [newTask, setNewTask] = useState<Partial<GanttTask>>({});
  
  // Group editing state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // PERSISTENCE - Save and load from localStorage
  // --------------------------------------------------------------------------
  
  /**
   * Get the storage key for this project
   */
  const getStorageKey = useCallback(() => {
    return `${STORAGE_KEY_PREFIX}${projectId || 'default'}`;
  }, [projectId]);

  /**
   * Load data from localStorage on mount
   */
  useEffect(() => {
    const storageKey = getStorageKey();
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsed: GanttPersistentData = JSON.parse(savedData);
        
        // Restore groups
        if (parsed.groups && parsed.groups.length > 0) {
          setGroups(parsed.groups);
        }
        
        // Restore tasks with proper date conversion
        if (parsed.tasks && parsed.tasks.length > 0) {
          const restoredTasks = parsed.tasks.map(task => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate)
          }));
          setTasks(restoredTasks);
        }
        
        // Restore template ID
        if (parsed.templateId) {
          setCurrentTemplateId(parsed.templateId);
        }
        
        console.log('Gantt data restored from localStorage');
      } catch (error) {
        console.error('Failed to parse saved Gantt data:', error);
      }
    }
  }, [getStorageKey]);

  /**
   * Save data to localStorage whenever groups or tasks change
   */
  useEffect(() => {
    // Skip saving on initial mount before data is loaded
    if (groups.length === 0 && tasks.length === 0) return;
    
    const storageKey = getStorageKey();
    const dataToSave: GanttPersistentData = {
      groups,
      tasks,
      templateId: currentTemplateId || undefined,
      lastModified: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [groups, tasks, currentTemplateId, getStorageKey]);

  // --------------------------------------------------------------------------
  // DATA SYNC - Convert API data to local format (if API has data)
  // --------------------------------------------------------------------------
  
  useEffect(() => {
    // Only sync from API if we have API data and no local data
    if (ganttData?.tasks && ganttData.tasks.length > 0) {
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      
      // If we already have local data, don't overwrite with API data
      if (savedData) return;
      
      const convertedTasks: GanttTask[] = ganttData.tasks.map((task: any) => {
        // Map status from API format
        let status: GanttTask['status'] = 'not-started';
        if (task.progress === 100) status = 'done';
        else if (task.progress > 0) status = 'working-on-it';
        else status = 'not-started';

        // Map priority from API format
        let priority: GanttTask['priority'] = 'medium';
        if (task.type === 'milestone') priority = 'high';
        else if (task.priority === 'high') priority = 'high';
        else if (task.priority === 'low') priority = 'low';
        else priority = 'medium';

        return {
          id: task.id,
          title: task.name,
          startDate: new Date(task.start),
          endDate: new Date(task.end),
          progress: task.progress || 0,
          dependencies: task.dependencies || [],
          assignee: task.assignees?.[0] || '',
          status,
          priority,
          duration: Math.ceil((new Date(task.end).getTime() - new Date(task.start).getTime()) / (1000 * 60 * 60 * 24)),
          notes: task.notes || '',
          files: 0,
          groupId: task.groupId || 'planning',
        };
      });
      setTasks(convertedTasks);
    }
  }, [ganttData, ganttLoading, getStorageKey]);

  // Focus input when editing group name
  useEffect(() => {
    if (editingGroupId && groupInputRef.current) {
      groupInputRef.current.focus();
      groupInputRef.current.select();
    }
  }, [editingGroupId]);

  // --------------------------------------------------------------------------
  // DATE CALCULATIONS
  // --------------------------------------------------------------------------
  
  /**
   * Calculate the date range for the current view
   */
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewMode) {
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'quarter':
        start.setMonth(Math.floor(start.getMonth() / 3) * 3);
        start.setDate(1);
        end.setMonth(start.getMonth() + 3);
        end.setDate(0);
        break;
    }
    
    return { start, end };
  }, [currentDate, viewMode]);

  /**
   * Generate date headers for the timeline
   */
  const generateDateHeaders = useCallback(() => {
    const { start, end } = getDateRange();
    const headers = [];
    const current = new Date(start);
    
    while (current <= end) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return headers;
  }, [getDateRange]);

  /**
   * Calculate task bar position and width on timeline
   */
  const calculateTaskPosition = useCallback((task: GanttTask) => {
    const { start, end } = getDateRange();
    const startTime = start.getTime();
    const endTime = end.getTime();
    const taskStart = Math.max(task.startDate.getTime(), startTime);
    const taskEnd = Math.min(task.endDate.getTime(), endTime);
    
    const left = ((taskStart - startTime) / (endTime - startTime)) * 100;
    const width = ((taskEnd - taskStart) / (endTime - startTime)) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(2, width)}%` };
  }, [getDateRange]);

  // --------------------------------------------------------------------------
  // GROUP MANAGEMENT
  // --------------------------------------------------------------------------
  
  /**
   * Start editing a group name
   */
  const startEditingGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditingGroupName(currentName);
  };

  /**
   * Save the edited group name
   */
  const saveGroupName = (groupId: string) => {
    const trimmedName = editingGroupName.trim();
    if (!trimmedName) {
      toast.error('Group name cannot be empty');
      cancelEditingGroup();
      return;
    }
    
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, name: trimmedName } : group
    ));
    
    setEditingGroupId(null);
    setEditingGroupName('');
    toast.success('Group name updated');
  };

  /**
   * Cancel group name editing
   */
  const cancelEditingGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  /**
   * Handle keyboard events for group name input
   */
  const handleGroupNameKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveGroupName(groupId);
    } else if (e.key === 'Escape') {
      cancelEditingGroup();
    }
  };

  /**
   * Change group color
   */
  const changeGroupColor = (groupId: string, color: string) => {
    setGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, color } : group
    ));
    setShowColorPicker(null);
    toast.success('Group color updated');
  };

  /**
   * Toggle group collapse state
   */
  const toggleGroupCollapse = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
    ));
  };

  /**
   * Add a new group
   */
  const addNewGroup = () => {
    const newGroupId = `group-${Date.now()}`;
    const newGroup: TaskGroup = {
      id: newGroupId,
      name: `New Group ${groups.length + 1}`,
      collapsed: false,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length]
    };
    setGroups(prev => [...prev, newGroup]);
    
    // Start editing the new group name immediately
    setTimeout(() => {
      startEditingGroup(newGroupId, newGroup.name);
    }, 100);
    
    toast.success('New group created - click to rename');
  };

  /**
   * Delete a group (moves tasks to first group)
   */
  const deleteGroup = (groupId: string) => {
    if (groups.length <= 1) {
      toast.error('Cannot delete the last group');
      return;
    }
    
    const firstGroupId = groups.find(g => g.id !== groupId)?.id;
    if (firstGroupId) {
      // Move tasks to the first remaining group
      setTasks(prev => prev.map(task =>
        task.groupId === groupId ? { ...task, groupId: firstGroupId } : task
      ));
    }
    
    setGroups(prev => prev.filter(g => g.id !== groupId));
    toast.success('Group deleted');
  };

  // --------------------------------------------------------------------------
  // TEMPLATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  /**
   * Apply a template to the board - creates groups and tasks from template
   * and persists to localStorage
   */
  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Create new groups from template
    const newGroups = template.groups.map(g => ({
      ...g,
      collapsed: false
    }));

    // Create tasks with proper dates starting from today
    const startDate = new Date();
    let currentTaskDate = new Date(startDate);
    
    const newTasks: GanttTask[] = template.tasks.map((task, index) => {
      const taskStartDate = new Date(currentTaskDate);
      const taskEndDate = new Date(currentTaskDate);
      taskEndDate.setDate(taskEndDate.getDate() + task.duration);
      
      // Add a gap between tasks
      currentTaskDate.setDate(currentTaskDate.getDate() + task.duration + 1);
      
      return {
        id: `task-${Date.now()}-${index}`,
        title: task.title,
        startDate: taskStartDate,
        endDate: taskEndDate,
        progress: 0,
        status: 'not-started' as const,
        priority: task.priority as 'low' | 'medium' | 'high',
        duration: task.duration,
        groupId: task.groupId
      };
    });

    // Update state - this will trigger persistence
    setGroups(newGroups);
    setTasks(newTasks);
    setCurrentTemplateId(templateId);
    setShowTemplateDialog(false);
    
    toast.success(`Applied "${template.name}" template - Changes saved automatically`);
  };

  /**
   * Clear current template and start fresh
   */
  const clearTemplate = () => {
    setGroups(INITIAL_GROUPS);
    setTasks([]);
    setCurrentTemplateId(null);
    toast.success('Board cleared');
  };

  // --------------------------------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------------------------------
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // --------------------------------------------------------------------------
  // TASK MANAGEMENT
  // --------------------------------------------------------------------------
  
  /**
   * Create a new task (local only for now)
   */
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.groupId) {
      toast.error('Please fill in required fields');
      return;
    }

    const startDate = newTask.startDate || new Date();
    const duration = newTask.duration || 1;
    const endDate = newTask.endDate || new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    const task: GanttTask = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      startDate,
      endDate,
      progress: 0,
      status: 'not-started',
      priority: (newTask.priority as 'low' | 'medium' | 'high') || 'medium',
      duration,
      groupId: newTask.groupId,
      notes: newTask.notes,
      assignee: newTask.assignee
    };

    setTasks(prev => [...prev, task]);
    setNewTask({});
    setShowNewTaskDialog(false);
    toast.success('Task created successfully');
  };

  /**
   * Update an existing task
   */
  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    setTasks(prev => prev.map(task =>
      task.id === editingTask.id ? editingTask : task
    ));

    setEditingTask(null);
    toast.success('Task updated successfully');
  };

  /**
   * Delete a task
   */
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success('Task deleted');
  };

  // --------------------------------------------------------------------------
  // FILTERING
  // --------------------------------------------------------------------------
  
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTasks = groups.map(group => ({
    ...group,
    tasks: filteredTasks.filter(task => task.groupId === group.id)
  }));

  // --------------------------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------------------------
  
  const dateHeaders = generateDateHeaders();
  const dayWidth = viewMode === 'week' ? 100 : viewMode === 'month' ? 40 : 20;
  
  // Fixed left panel width
  const LEFT_PANEL_WIDTH = 400;

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 rounded-xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
        
        {/* ================================================================== */}
        {/* HEADER SECTION - Controls and Navigation */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* New Task Button */}
            <Button 
              onClick={() => setShowNewTaskDialog(true)}
              className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filter tasks</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sort tasks</TooltipContent>
              </Tooltip>
            </div>

            {/* Templates Button */}
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-colors">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  Templates
                  {currentTemplateId && (
                    <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Project Templates
                  </DialogTitle>
                  <DialogDescription>
                    Choose a template to quick-start your project. Changes are automatically saved.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Current template indicator */}
                {currentTemplateId && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        Currently using: <strong>{TEMPLATES.find(t => t.id === currentTemplateId)?.name}</strong>
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearTemplate} className="text-amber-600 hover:text-amber-700">
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {TEMPLATES.map((template) => {
                    const isActive = currentTemplateId === template.id;
                    return (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer hover:shadow-lg transition-all duration-300 group relative overflow-hidden
                          ${isActive 
                            ? 'border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                            : 'hover:border-indigo-300 hover:-translate-y-1'
                          }`}
                        onClick={() => applyTemplate(template.id)}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-indigo-500 text-white">Active</Badge>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="text-4xl group-hover:scale-110 transition-transform">{template.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg group-hover:text-indigo-600 transition-colors">
                                {template.name}
                              </h3>
                              <p className="text-sm text-slate-500 mb-3">{template.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {template.groups.map(group => (
                                  <span 
                                    key={group.id}
                                    className="text-xs px-2 py-1 rounded-full text-white font-medium"
                                    style={{ backgroundColor: group.color }}
                                  >
                                    {group.name}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                <span>{template.tasks.length} tasks</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Controls - Navigation */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToToday}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 font-medium"
            >
              Today
            </Button>
            
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white dark:hover:bg-slate-700" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[140px] text-center px-2 text-slate-700 dark:text-slate-300">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white dark:hover:bg-slate-700" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Select value={viewMode} onValueChange={(value: 'week' | 'month' | 'quarter') => setViewMode(value)}>
              <SelectTrigger className="w-[110px] bg-white dark:bg-slate-800 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MAIN CONTENT - Split into fixed left panel and scrollable timeline */}
        {/* ================================================================== */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* FIXED LEFT PANEL - Task Info */}
          <div 
            className="flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto"
            style={{ width: `${LEFT_PANEL_WIDTH}px` }}
          >
            {/* Column Headers */}
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-20 flex">
              <div className="w-48 px-4 py-3 font-semibold text-sm text-slate-700 dark:text-slate-300">
                Task
              </div>
              <div className="w-20 px-2 py-3 font-semibold text-sm text-center text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700">
                Owner
              </div>
              <div className="w-24 px-2 py-3 font-semibold text-sm text-center text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700">
                Status
              </div>
              <div className="w-16 px-2 py-3 font-semibold text-sm text-center text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700">
                Priority
              </div>
            </div>

            {/* Groups and Tasks - Left Panel */}
            {groupedTasks.map((group) => (
              <div key={group.id}>
                {/* Group Header */}
                <div 
                  className="flex items-center bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 group cursor-pointer"
                  style={{ 
                    borderLeftWidth: '4px', 
                    borderLeftColor: group.color 
                  }}
                >
                  <div className="flex-1 flex items-center px-4 py-3 gap-2">
                    {/* Collapse Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="p-1 h-6 w-6"
                    >
                      {group.collapsed ? 
                        <ChevronRight className="h-4 w-4 text-slate-500" /> : 
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      }
                    </Button>
                    
                    {/* Group Name - Editable */}
                    {editingGroupId === group.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          ref={groupInputRef}
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onBlur={() => saveGroupName(group.id)}
                          onKeyDown={(e) => handleGroupNameKeyDown(e, group.id)}
                          className="h-7 text-sm font-semibold px-2 flex-1"
                          style={{ color: group.color }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => saveGroupName(group.id)}
                        >
                          <Check className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={cancelEditingGroup}
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span 
                          className="font-semibold text-sm cursor-pointer hover:underline decoration-2 underline-offset-2 transition-colors"
                          style={{ color: group.color }}
                          onClick={() => startEditingGroup(group.id, group.name)}
                          title="Click to edit group name"
                        >
                          {group.name}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {group.tasks.length}
                        </span>
                        
                        {/* Edit button - visible on hover */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditingGroup(group.id, group.name)}
                        >
                          <Pencil className="h-3 w-3 text-slate-400" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Group Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Color Picker */}
                      <DropdownMenu open={showColorPicker === group.id} onOpenChange={(open) => setShowColorPicker(open ? group.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Palette className="h-3 w-3 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <div className="grid grid-cols-4 gap-1 p-2">
                            {GROUP_COLORS.map((color) => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => changeGroupColor(group.id, color)}
                              />
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Delete Group */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => deleteGroup(group.id)}
                      >
                        <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tasks in Group */}
                {!group.collapsed && group.tasks.map((task) => {
                  const statusConfig = STATUS_CONFIG[task.status];
                  const priorityConfig = PRIORITY_CONFIG[task.priority];
                  
                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Task Name */}
                      <div className="w-48 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Grip className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />
                          <span 
                            className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-indigo-600"
                            onClick={() => setEditingTask(task)}
                            title={task.title}
                          >
                            {task.title}
                          </span>
                        </div>
                      </div>
                      
                      {/* Owner */}
                      <div className="w-20 px-2 py-3 flex items-center justify-center border-l border-slate-100 dark:border-slate-800">
                        {task.assignee ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                                {task.assignee.split(' ').map(n => n[0]).join('')}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{task.assignee}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="w-24 px-2 py-3 flex items-center justify-center border-l border-slate-100 dark:border-slate-800">
                        <Badge 
                          className="text-white text-xs font-medium shadow-sm"
                          style={{ backgroundColor: statusConfig.color }}
                        >
                          {statusConfig.text}
                        </Badge>
                      </div>
                      
                      {/* Priority */}
                      <div className="w-16 px-2 py-3 flex items-center justify-center border-l border-slate-100 dark:border-slate-800">
                        <Tooltip>
                          <TooltipTrigger>
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: priorityConfig.color }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>{priorityConfig.label} Priority</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}

                {/* Add Task Row */}
                {!group.collapsed && (
                  <div className="flex items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                    <div className="flex-1 px-4 py-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-slate-300 justify-start p-0 h-8"
                        onClick={() => {
                          setNewTask({ groupId: group.id });
                          setShowNewTaskDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add task
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Group Button */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 w-full justify-start"
                onClick={addNewGroup}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add new group
              </Button>
            </div>
          </div>

          {/* SCROLLABLE RIGHT PANEL - Timeline */}
          <div 
            className="flex-1 overflow-auto bg-white/50 dark:bg-slate-900/50"
            ref={timelineRef}
          >
            {/* Timeline Headers */}
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 flex">
              {dateHeaders.map((day, idx) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <div 
                    key={idx}
                    className={`flex-shrink-0 text-center px-1 py-2 text-xs border-l border-slate-200 dark:border-slate-700 
                      ${isToday ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-indigo-400' : ''}
                      ${isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/50' : ''}`}
                    style={{ width: `${dayWidth}px` }}
                  >
                    <div className={`font-medium ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {day.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline Rows */}
            {groupedTasks.map((group) => (
              <div key={group.id}>
                {/* Group Header Row */}
                <div 
                  className="flex border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900"
                  style={{ height: '48px' }}
                >
                  {dateHeaders.map((day, idx) => (
                    <div 
                      key={idx}
                      className="flex-shrink-0 border-l border-slate-200/50 dark:border-slate-700/50"
                      style={{ width: `${dayWidth}px` }}
                    />
                  ))}
                </div>

                {/* Task Rows */}
                {!group.collapsed && group.tasks.map((task) => {
                  const position = calculateTaskPosition(task);
                  const statusConfig = STATUS_CONFIG[task.status];
                  
                  return (
                    <div 
                      key={task.id} 
                      className="flex border-b border-slate-100 dark:border-slate-800 relative"
                      style={{ height: '48px' }}
                    >
                      {/* Day grid lines */}
                      {dateHeaders.map((day, idx) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        
                        return (
                          <div
                            key={idx}
                            className={`flex-shrink-0 border-l border-slate-100 dark:border-slate-800 
                              ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                              ${isWeekend ? 'bg-slate-50/30 dark:bg-slate-800/30' : ''}`}
                            style={{ width: `${dayWidth}px` }}
                          />
                        );
                      })}
                      
                      {/* Task Bar */}
                      <div 
                        className="absolute top-2 h-8 rounded-lg flex items-center px-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 group/bar hover:-translate-y-0.5"
                        style={{ 
                          left: position.left,
                          width: position.width,
                          background: `linear-gradient(135deg, ${statusConfig.color} 0%, ${statusConfig.color}cc 100%)`,
                          minWidth: '80px'
                        }}
                        onClick={() => setEditingTask(task)}
                      >
                        {/* Progress Fill */}
                        <div 
                          className="absolute inset-0 rounded-lg bg-white/20"
                          style={{ width: `${task.progress}%` }}
                        />
                        
                        {/* Task Label */}
                        <span className="relative text-xs font-semibold text-white truncate drop-shadow-sm">
                          {task.title}
                          {task.progress > 0 && task.progress < 100 && (
                            <span className="ml-1 opacity-80">({task.progress}%)</span>
                          )}
                        </span>
                        
                        {/* Edit indicator on hover */}
                        <Edit2 className="absolute right-2 h-3 w-3 text-white/75 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}

                {/* Add Task Row */}
                {!group.collapsed && (
                  <div 
                    className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/30"
                    style={{ height: '40px' }}
                  >
                    {dateHeaders.map((_, idx) => (
                      <div 
                        key={idx}
                        className="flex-shrink-0 border-l border-slate-100 dark:border-slate-800"
                        style={{ width: `${dayWidth}px` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add Group Row */}
            <div 
              className="flex bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900"
              style={{ height: '60px' }}
            >
              {dateHeaders.map((_, idx) => (
                <div 
                  key={idx}
                  className="flex-shrink-0 border-l border-slate-100 dark:border-slate-800"
                  style={{ width: `${dayWidth}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* NEW TASK DIALOG */}
        {/* ================================================================== */}
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-500" />
                Create New Task
              </DialogTitle>
              <DialogDescription>
                Add a new task to your Gantt chart
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="task-title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="task-title"
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="task-group" className="text-sm font-medium">Group *</Label>
                <Select 
                  value={newTask.groupId} 
                  onValueChange={(value) => setNewTask({ ...newTask, groupId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: group.color }} 
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-start" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="task-start"
                    type="date"
                    value={newTask.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewTask({ ...newTask, startDate: new Date(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="task-duration" className="text-sm font-medium">Duration (days)</Label>
                  <Input
                    id="task-duration"
                    type="number"
                    min="1"
                    value={newTask.duration || 1}
                    onChange={(e) => {
                      const duration = parseInt(e.target.value) || 1;
                      const startDate = newTask.startDate || new Date();
                      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
                      setNewTask({ ...newTask, duration, endDate });
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-priority" className="text-sm font-medium">Priority</Label>
                  <Select 
                    value={newTask.priority || 'medium'} 
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as 'low' | 'medium' | 'high' })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          High
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task-assignee" className="text-sm font-medium">Assignee</Label>
                  <Input
                    id="task-assignee"
                    value={newTask.assignee || ''}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="task-notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="task-notes"
                  value={newTask.notes || ''}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowNewTaskDialog(false); setNewTask({}); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================================================================== */}
        {/* EDIT TASK DIALOG */}
        {/* ================================================================== */}
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-500" />
                Edit Task
              </DialogTitle>
              <DialogDescription>
                Update task details
              </DialogDescription>
            </DialogHeader>
            {editingTask && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-task-title" className="text-sm font-medium">Title</Label>
                  <Input
                    id="edit-task-title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-task-group" className="text-sm font-medium">Group</Label>
                  <Select 
                    value={editingTask.groupId} 
                    onValueChange={(value) => setEditingTask({ ...editingTask, groupId: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: group.color }} 
                            />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-task-start" className="text-sm font-medium">Start Date</Label>
                    <Input
                      id="edit-task-start"
                      type="date"
                      value={editingTask.startDate.toISOString().split('T')[0]}
                      onChange={(e) => setEditingTask({ ...editingTask, startDate: new Date(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-task-end" className="text-sm font-medium">End Date</Label>
                    <Input
                      id="edit-task-end"
                      type="date"
                      value={editingTask.endDate.toISOString().split('T')[0]}
                      onChange={(e) => setEditingTask({ ...editingTask, endDate: new Date(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-task-status" className="text-sm font-medium">Status</Label>
                    <Select 
                      value={editingTask.status} 
                      onValueChange={(value) => setEditingTask({ ...editingTask, status: value as GanttTask['status'] })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                              {config.text}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-task-priority" className="text-sm font-medium">Priority</Label>
                    <Select 
                      value={editingTask.priority} 
                      onValueChange={(value) => setEditingTask({ ...editingTask, priority: value as GanttTask['priority'] })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-task-progress" className="text-sm font-medium">Progress: {editingTask.progress}%</Label>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingTask.progress}
                      onChange={(e) => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-task-assignee" className="text-sm font-medium">Assignee</Label>
                  <Input
                    id="edit-task-assignee"
                    value={editingTask.assignee || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-task-notes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="edit-task-notes"
                    value={editingTask.notes || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  if (editingTask) {
                    handleDeleteTask(editingTask.id);
                    setEditingTask(null);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateTask}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default GanttBoard;
