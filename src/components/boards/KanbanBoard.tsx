// KanbanBoard: The most advanced, feature-rich, and creative Kanban board on the internet!
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertTriangle,
    Archive,
    BarChart3,
    Bot,
    Calendar,
    CheckSquare,
    ChevronDown, ChevronUp,
    Clock,
    Copy,
    DollarSign,
    Download, Edit2,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    Lightbulb,
    ListChecks, MessageSquare, MoreHorizontal, Move, Palette,
    Paperclip,
    Pause,
    Play,
    Plus,
    Search, Settings,
    Star, StarOff, Tag,
    Target,
    Timer,
    Trash2,
    TrendingUp,
    User,
    Workflow,
    Zap
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BOARD_TEMPLATES, CARD_TEMPLATES } from './KanbanTemplates';
import { toast } from 'sonner';
import {
  useKanbanColumns,
  useKanbanCards,
  useCreateKanbanCard,
  useUpdateKanbanCard,
  useDeleteKanbanCard,
  useMoveKanbanCard,
  useCreateKanbanColumn,
  useUpdateKanbanColumn,
  useDeleteKanbanColumn,
  KanbanCard as ApiKanbanCard,
  KanbanColumn as ApiKanbanColumn,
} from '@/hooks/useKanban';
import { useQueryClient } from '@tanstack/react-query';

// Enhanced Types
export type KanbanColumn = {
  id: string;
  name: string;
  color: string;
  collapsed?: boolean;
  wipLimit?: number;
  description?: string;
  automationRules?: AutomationRule[];
  position: number;
};

export type AutomationRule = {
  id: string;
  name: string;
  trigger: 'card_moved' | 'due_date_approaching' | 'card_created' | 'assignee_changed' | 'label_added';
  condition: string;
  action: 'move_card' | 'assign_user' | 'add_label' | 'send_notification' | 'create_subtask';
  actionData: any;
  enabled: boolean;
};

export type TimeEntry = {
  id: string;
  cardId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  description: string;
  billable: boolean;
};

export type KanbanCard = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  duration: number;
  estimatedHours: number;
  actualHours: number;
  dueDate: string;
  startDate: string;
  notes: string;
  assignee: string;
  assignees: string[];
  labels: string[];
  subtasks: { id: string; text: string; done: boolean; assignee?: string; dueDate?: string }[];
  checklists: { id: string; title: string; items: { id: string; text: string; done: boolean }[] }[];
  attachments: { id: string; name: string; url: string; type: string; size: number; uploadedBy: string; uploadedAt: string }[];
  comments: { id: string; user: string; text: string; date: string; mentions: string[]; reactions: { emoji: string; users: string[] }[] }[];
  cover: string;
  dependencies: string[];
  blockedBy: string[];
  blocking: string[];
  recurring: boolean;
  recurringPattern?: string;
  watchers: string[];
  votes: number;
  voters: string[];
  columnId: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  customFields: { [key: string]: any };
  timeEntries: TimeEntry[];
  isTemplate: boolean;
  templateCategory?: string;
  aiSuggestions: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  businessValue: number;
  storyPoints: number;
  epic?: string;
  sprint?: string;
  version?: string;
  component?: string;
  fixVersion?: string;
  environment?: string;
  testCases: string[];
  acceptanceCriteria: string[];
  definition_of_done: string[];
  position: number;
};

export type BoardFilter = {
  assignees: string[];
  labels: string[];
  priorities: string[];
  dueDateRange: { start?: string; end?: string };
  createdDateRange: { start?: string; end?: string };
  archived: boolean;
  hasAttachments: boolean;
  hasComments: boolean;
  hasSubtasks: boolean;
  riskLevels: string[];
  businessValueRange: { min?: number; max?: number };
  storyPointsRange: { min?: number; max?: number };
};


export type BoardAnalytics = {
  totalCards: number;
  completedCards: number;
  overdueTasks: number;
  averageCompletionTime: number;
  burndownData: { date: string; remaining: number }[];
  velocityData: { sprint: string; completed: number }[];
  cycleTimeData: { stage: string; averageTime: number }[];
  leadTimeData: { date: string; leadTime: number }[];
  throughputData: { date: string; completed: number }[];
  cumulativeFlowData: { date: string; [key: string]: string | number }[];
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', name: 'Backlog', color: '#6b7280', position: 0, wipLimit: 20 },
  { id: 'todo', name: 'To Do', color: '#3b82f6', position: 1, wipLimit: 10 },
  { id: 'working', name: 'In Progress', color: '#f59e42', position: 2, wipLimit: 5 },
  { id: 'review', name: 'Review', color: '#8b5cf6', position: 3, wipLimit: 3 },
  { id: 'done', name: 'Done', color: '#22c55e', position: 4 }
];

const PRIORITY_COLORS = {
  'Low': '#22c55e',
  'Medium': '#f59e42', 
  'High': '#ef4444',
  'Critical': '#dc2626'
};

/**
 * KanbanBoard Component
 * 
 * A fully-featured Kanban board with:
 * - Real-time data synchronization across all views
 * - Drag-and-drop card management
 * - Column creation, editing, and deletion
 * - WIP limits and column collapse
 * - Rich card details with subtasks, comments, and attachments
 */
const KanbanBoard: React.FC<{
  projectId?: string;
  initialColumns?: KanbanColumn[];
  initialCards?: KanbanCard[];
  onExtractToProject?: (cards: KanbanCard[], columns: KanbanColumn[]) => void;
  onExtractToCustomDashboard?: (cards: KanbanCard[], columns: KanbanColumn[]) => void;
  onSaveAsTemplate?: (cards: KanbanCard[], columns: KanbanColumn[]) => void;
}> = ({
  projectId,
  initialColumns = DEFAULT_COLUMNS,
  initialCards = [],
  onExtractToProject,
  onExtractToCustomDashboard,
  onSaveAsTemplate
}) => {
  const queryClient = useQueryClient();
  
  // Fetch Kanban data from API with automatic refetching
  const { data: apiColumns = [], isLoading: columnsLoading, error: columnsError } = useKanbanColumns(projectId);
  const { data: apiCards = [], isLoading: cardsLoading, error: cardsError } = useKanbanCards(projectId);

  // Note: We no longer manually refetch on mount since React Query's refetchOnMount: 'always' 
  // handles this automatically. Removing the manual refetch prevents potential infinite loops
  // when refetch functions are recreated on each render.
  
  // Mutation hooks
  const createCard = useCreateKanbanCard();
  const updateCard = useUpdateKanbanCard();
  const deleteCard = useDeleteKanbanCard();
  const moveCard = useMoveKanbanCard();
  const createColumn = useCreateKanbanColumn();
  const updateColumn = useUpdateKanbanColumn();
  const deleteColumn = useDeleteKanbanColumn();

  // Core State - sync with API data
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [cards, setCards] = useState<KanbanCard[]>(initialCards);

  // Sync columns from API
  // Use a ref to track the last known good column count to detect incomplete responses
  const lastColumnCountRef = useRef<number>(0);
  
  useEffect(() => {
    // Only update columns when we have valid API data and we're not in a loading state
    // This prevents columns from disappearing during refetches
    if (!columnsLoading && apiColumns && Array.isArray(apiColumns)) {
      if (apiColumns.length > 0) {
        const convertedColumns: KanbanColumn[] = apiColumns.map((col: ApiKanbanColumn) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          position: col.position,
          wipLimit: col.wipLimit,
          collapsed: col.collapsed,
          description: col.description,
        }));
        
        // Sort by position to ensure correct order
        convertedColumns.sort((a, b) => a.position - b.position);
        
        // Defensive update: Check if we're losing columns unexpectedly
        setColumns(prevColumns => {
          // If we had columns before and the new data has fewer columns,
          // it might be an incomplete response - preserve existing columns and merge
          if (prevColumns.length > 0 && convertedColumns.length < prevColumns.length) {
            // Fewer columns than before - likely incomplete response or race condition
            // Merge: keep all existing, add/update from new data
            const merged = [...prevColumns];
            const newIds = new Set(convertedColumns.map(c => c.id));
            
            convertedColumns.forEach(newCol => {
              const index = merged.findIndex(c => c.id === newCol.id);
              if (index >= 0) {
                merged[index] = newCol; // Update existing
              } else {
                merged.push(newCol); // Add new
              }
            });
            
            merged.sort((a, b) => a.position - b.position);
            lastColumnCountRef.current = merged.length;
            console.log('[KanbanBoard] Preserved columns during merge:', {
              prevCount: prevColumns.length,
              newCount: convertedColumns.length,
              mergedCount: merged.length
            });
            return merged;
          }
          
          // Normal case: use API data as source of truth
          // This handles: initial load, complete updates, and adding new columns
          lastColumnCountRef.current = convertedColumns.length;
          return convertedColumns;
        });
      } else if (apiColumns.length === 0 && projectId) {
        // Only clear columns if we're sure there are none (not during initial load)
        setColumns(prevColumns => {
          // Only clear if we had no columns before and still have none
          if (prevColumns.length === 0) {
            // Refetch to get the auto-created columns
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['kanban', 'columns', projectId] });
            }, 1000);
            return prevColumns; // Keep empty state
          }
          // Preserve existing columns if API returns empty (might be a temporary issue)
          return prevColumns;
        });
      }
    }
    // Note: During loading, we preserve existing columns to prevent flickering
  }, [apiColumns, columnsLoading, projectId, queryClient]);

  // Sync cards from API
  useEffect(() => {
    if (apiCards && apiCards.length > 0) {
      const convertedCards: KanbanCard[] = apiCards.map((card: ApiKanbanCard) => ({
        id: card.id,
        title: card.title,
        description: card.description || '',
        status: card.status,
        priority: (card.priority as 'Low' | 'Medium' | 'High' | 'Critical') || 'Medium',
        duration: card.estimatedHours ? Math.ceil(card.estimatedHours / 8) : 1,
        estimatedHours: card.estimatedHours || 0,
        actualHours: card.actualHours || 0,
        dueDate: card.dueDate || '',
        startDate: card.startDate || card.createdAt,
        notes: card.description || '',
        assignee: card.assignees?.[0] || '',
        assignees: card.assignees || [],
        labels: card.labels || [],
        subtasks: card.subtasks || [],
        checklists: card.checklists || [],
        attachments: card.attachments || [],
        comments: card.comments || [],
        cover: '',
        dependencies: card.dependencies || [],
        blockedBy: card.blockedBy || [],
        blocking: card.blocking || [],
        recurring: false,
        watchers: [],
        votes: 0,
        voters: [],
        columnId: card.columnId,
        archived: card.archived || false,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        createdBy: card.createdBy,
        customFields: card.customFields || {},
        timeEntries: [],
        isTemplate: false,
        aiSuggestions: [],
        riskLevel: 'Low',
        businessValue: 0,
        storyPoints: 0,
        testCases: [],
        acceptanceCriteria: [],
        definition_of_done: [],
        position: card.position || 0,
      }));
      setCards(convertedCards);
    } else if (!cardsLoading && (!apiCards || apiCards.length === 0)) {
      setCards([]);
    }
  }, [apiCards, cardsLoading]);
  const [boardTitle, setBoardTitle] = useState('My Kanban Board');
  const [boardStarred, setBoardStarred] = useState(false);
  const [boardDescription, setBoardDescription] = useState('');
  
  // Dialog States
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState<KanbanCard | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  const [showBulkOperationsDialog, setShowBulkOperationsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTimeTrackingDialog, setShowTimeTrackingDialog] = useState(false);
  
  // Form States
  const [newCard, setNewCard] = useState<Partial<KanbanCard>>({});
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  
  // UI States
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [showColumnColorPicker, setShowColumnColorPicker] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Filter State
  const [filters, setFilters] = useState<BoardFilter>({
    assignees: [],
    labels: [],
    priorities: [],
    dueDateRange: {},
    createdDateRange: {},
    archived: false,
    hasAttachments: false,
    hasComments: false,
    hasSubtasks: false,
    riskLevels: [],
    businessValueRange: {},
    storyPointsRange: {}
  });
  
  // Automation State
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [newAutomationRule, setNewAutomationRule] = useState<Partial<AutomationRule>>({});
  
  // Time Tracking
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  
  // Analytics
  const [analytics, setAnalytics] = useState<BoardAnalytics | null>(null);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Timer Effect
  useEffect(() => {
    if (activeTimer && timerStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - timerStartTime.getTime());
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTimer, timerStartTime]);
  
  // Analytics Calculation
  const calculateAnalytics = useMemo(() => {
    const totalCards = cards.length;
    const completedCards = cards.filter(card => card.columnId === 'done').length;
    const overdueTasks = cards.filter(card => 
      card.dueDate && new Date(card.dueDate) < new Date() && card.columnId !== 'done'
    ).length;
    
    const completedTasks = cards.filter(card => card.columnId === 'done');
    const averageCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, card) => {
          const created = new Date(card.createdAt);
          const updated = new Date(card.updatedAt);
          return sum + (updated.getTime() - created.getTime());
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    
    return {
      totalCards,
      completedCards,
      overdueTasks,
      averageCompletionTime,
      burndownData: [],
      velocityData: [],
      cycleTimeData: [],
      leadTimeData: [],
      throughputData: [],
      cumulativeFlowData: []
    };
  }, [cards]);
  
  // AI Suggestions
  const generateAISuggestions = (card: KanbanCard): string[] => {
    const suggestions = [];
    
    if (!card.assignee) {
      suggestions.push("Consider assigning this task to a team member");
    }
    
    if (!card.dueDate) {
      suggestions.push("Set a due date to track progress");
    }
    
    if ((!card.subtasks || card.subtasks.length === 0) && card.description && card.description.length > 100) {
      suggestions.push("Break this large task into smaller subtasks");
    }
    
    if (card.priority === 'High' && card.columnId === 'backlog') {
      suggestions.push("High priority task should be moved to active work");
    }
    
    if (card.dependencies && card.dependencies.length > 0) {
      suggestions.push("Check if dependencies are completed before starting");
    }
    
    return suggestions;
  };
  
  // Template application
  const applyTemplate = (templateId: string) => {
    const template = BOARD_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    const newColumns = template.columns.map((col, index) => ({ 
      ...col, 
      collapsed: false,
      position: index
    }));
    
    const newCards = template.cards.map((c, i) => ({
      ...CARD_TEMPLATES[c.template],
      id: generateId(),
      title: c.title,
      columnId: c.column,
      position: i,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      aiSuggestions: [],
      riskLevel: 'Low' as const,
      businessValue: 0,
      storyPoints: 0,
      timeEntries: [],
      isTemplate: false,
      customFields: {},
      testCases: [],
      acceptanceCriteria: [],
      definition_of_done: []
    }));
    
    setColumns(newColumns);
    setCards(newCards);
    setShowTemplateDialog(false);
  };
  
  // Card creation with enhanced features
  const handleCreateCard = async () => {
    if (!newCard.title || !newCard.columnId || !projectId) {
      toast.error('Please fill in required fields');
      return;
    }

    // Ensure we have columns loaded
    if (columns.length === 0) {
      toast.error('Please wait for columns to load');
      return;
    }
    
    try {
      // Verify column exists
      const selectedColumn = columns.find(col => col.id === newCard.columnId);
      if (!selectedColumn) {
        toast.error('Selected column not found. Please refresh the page.');
        return;
      }

      // Map priority to API format
      const priorityMap: Record<string, string> = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Critical': 'critical'
      };

      // Map column name to status (fallback if column doesn't have status)
      let status = 'todo';
      const columnNameLower = selectedColumn.name.toLowerCase();
      if (columnNameLower.includes('done') || columnNameLower.includes('complete')) status = 'done';
      else if (columnNameLower.includes('progress') || columnNameLower.includes('working')) status = 'in-progress';
      else if (columnNameLower.includes('review')) status = 'review';
      else if (columnNameLower.includes('blocked') || columnNameLower.includes('backlog')) status = 'blocked';
      else status = 'todo';

      const base = { ...CARD_TEMPLATES['task'] };
      
      await createCard.mutateAsync({
        projectId,
        data: {
          title: newCard.title,
          columnId: newCard.columnId as string,
          description: newCard.description || '',
          status,
          priority: priorityMap[newCard.priority as string] || 'medium',
          dueDate: newCard.dueDate ? new Date(newCard.dueDate).toISOString() : undefined,
          startDate: newCard.startDate ? new Date(newCard.startDate).toISOString() : undefined,
          estimatedHours: newCard.estimatedHours || 0,
          assignees: newCard.assignees || [],
          labels: newCard.labels || base.labels,
          subtasks: [],
          checklists: [],
          attachments: [],
          comments: [],
          dependencies: [],
          blockedBy: [],
          blocking: [],
          customFields: {
            businessValue: newCard.businessValue || 0,
            storyPoints: newCard.storyPoints || 0,
            epic: newCard.epic,
            sprint: newCard.sprint,
            version: newCard.version,
            component: newCard.component,
            fixVersion: newCard.fixVersion,
            environment: newCard.environment,
          },
        },
      });

      setNewCard({});
      setShowNewCardDialog(false);
      // Error toast is handled by the hook
    } catch (error) {
      console.error('Failed to create card:', error);
      // Error toast is handled by the hook
    }
  };
  
  // Enhanced drag & drop
  const onCardDragStart = (cardId: string) => {
    setDraggedCardId(cardId);
  };
  
  const onCardDrop = async (columnId: string, position?: number) => {
    if (!draggedCardId || !projectId) return;
    
    const card = cards.find(c => c.id === draggedCardId);
    if (!card) return;
    
    const oldColumnId = card.columnId;
    const newPosition = position ?? cards.filter(c => c.columnId === columnId).length;
    
    // Map column ID back to status
    let newStatus = 'todo';
    if (columnId === 'todo') newStatus = 'todo';
    else if (columnId === 'working') newStatus = 'in-progress';
    else if (columnId === 'review') newStatus = 'review';
    else if (columnId === 'done') newStatus = 'done';
    else if (columnId === 'backlog') newStatus = 'blocked';
    
    // Update in API using moveCard
    try {
      await moveCard.mutateAsync({
        projectId,
        cardId: draggedCardId,
        targetColumnId: columnId,
        newPosition,
      });
      
      // Also update status if column changed
      if (oldColumnId !== columnId) {
        await updateCard.mutateAsync({
          projectId,
          cardId: draggedCardId,
          data: { status: newStatus },
        });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    }
    
    setDraggedCardId(null);
    
    // Trigger automation rules
    if (oldColumnId !== columnId) {
      triggerAutomationRules('card_moved', { ...card, columnId });
    }
  };
  
  // Column drag handlers
  const onColumnDragStart = (columnId: string) => {
    setDraggedColumnId(columnId);
  };

  const onColumnDrop = (position: number) => {
    if (!draggedColumnId) return;
    
    const draggedColumn = columns.find(col => col.id === draggedColumnId);
    if (!draggedColumn) return;
    
    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex(col => col.id === draggedColumnId);
    const targetIndex = position;
    
    // Remove dragged column and insert at new position
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);
    
    // Update positions
    const updatedColumns = newColumns.map((col, index) => ({ ...col, position: index }));
    
    setColumns(updatedColumns);
    setDraggedColumnId(null);
  };
  
  // Automation Rules Engine
  const triggerAutomationRules = (trigger: AutomationRule['trigger'], card: KanbanCard) => {
    const applicableRules = automationRules.filter(rule => 
      rule.enabled && rule.trigger === trigger
    );
    
    applicableRules.forEach(rule => {
      executeAutomationAction(rule, card);
    });
  };
  
  const executeAutomationAction = (rule: AutomationRule, card: KanbanCard) => {
    switch (rule.action) {
      case 'move_card':
        if (rule.actionData.targetColumn) {
          setCards(prev => prev.map(c => 
            c.id === card.id 
              ? { ...c, columnId: rule.actionData.targetColumn }
              : c
          ));
        }
        break;
      case 'assign_user':
        if (rule.actionData.userId) {
          setCards(prev => prev.map(c => 
            c.id === card.id 
              ? { ...c, assignee: rule.actionData.userId }
              : c
          ));
        }
        break;
      case 'add_label':
        if (rule.actionData.label) {
          setCards(prev => prev.map(c => 
            c.id === card.id 
              ? { ...c, labels: [...c.labels, rule.actionData.label] }
              : c
          ));
        }
        break;
      case 'send_notification':
        // In a real app, this would send actual notifications
        console.log(`Notification: ${rule.actionData.message}`);
        break;
      case 'create_subtask':
        if (rule.actionData.subtaskTitle) {
          setCards(prev => prev.map(c => 
            c.id === card.id 
              ? { 
                  ...c, 
                  subtasks: [...c.subtasks, {
                    id: generateId(),
                    text: rule.actionData.subtaskTitle,
                    done: false
                  }]
                }
              : c
          ));
        }
        break;
    }
  };
  
  // Time Tracking
  const startTimer = (cardId: string) => {
    if (activeTimer) {
      stopTimer();
    }
    
    setActiveTimer(cardId);
    setTimerStartTime(new Date());
    setElapsedTime(0);
  };
  
  const stopTimer = () => {
    if (activeTimer && timerStartTime) {
      const endTime = new Date();
      const duration = endTime.getTime() - timerStartTime.getTime();
      
      const timeEntry: TimeEntry = {
        id: generateId(),
        cardId: activeTimer,
        userId: 'current-user',
        startTime: timerStartTime,
        endTime,
        description: '',
        billable: false
      };
      
      setTimeEntries(prev => [...prev, timeEntry]);
      
      // Update card actual hours
      setCards(prev => prev.map(card => 
        card.id === activeTimer 
          ? { 
              ...card, 
              actualHours: card.actualHours + (duration / (1000 * 60 * 60)),
              timeEntries: [...card.timeEntries, timeEntry]
            }
          : card
      ));
    }
    
    setActiveTimer(null);
    setTimerStartTime(null);
    setElapsedTime(0);
  };
  
  // Bulk Operations
  const handleBulkOperation = (operation: string) => {
    switch (operation) {
      case 'archive':
        setCards(prev => prev.map(card => 
          selectedCards.includes(card.id) 
            ? { ...card, archived: true }
            : card
        ));
        break;
      case 'delete':
        setCards(prev => prev.filter(card => !selectedCards.includes(card.id)));
        break;
      case 'assign':
        // Would open assignee selector
        break;
      case 'add_label':
        // Would open label selector
        break;
      case 'move':
        // Would open column selector
        break;
    }
    setSelectedCards([]);
    setShowBulkOperationsDialog(false);
  };
  
  // Advanced Filtering
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Search term
      if (searchTerm && !card.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !card.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Assignees filter
      if (filters.assignees.length > 0 && !filters.assignees.includes(card.assignee)) {
        return false;
      }
      
      // Labels filter
      if (filters.labels.length > 0 && (!card.labels || !filters.labels.some(label => card.labels.includes(label)))) {
        return false;
      }
      
      // Priority filter
      if (filters.priorities.length > 0 && !filters.priorities.includes(card.priority)) {
        return false;
      }
      
      // Due date range
      if (filters.dueDateRange.start || filters.dueDateRange.end) {
        const dueDate = new Date(card.dueDate);
        if (filters.dueDateRange.start && dueDate < new Date(filters.dueDateRange.start)) {
          return false;
        }
        if (filters.dueDateRange.end && dueDate > new Date(filters.dueDateRange.end)) {
          return false;
        }
      }
      
      // Archived filter
      if (!filters.archived && card.archived) {
        return false;
      }
      
      // Has attachments filter
      if (filters.hasAttachments && (!card.attachments || card.attachments.length === 0)) {
        return false;
      }
      
      // Has comments filter
      if (filters.hasComments && (!card.comments || card.comments.length === 0)) {
        return false;
      }
      
      // Has subtasks filter
      if (filters.hasSubtasks && (!card.subtasks || card.subtasks.length === 0)) {
        return false;
      }
      
      return true;
    });
  }, [cards, searchTerm, filters]);
  
  // Column actions
  const handleAddColumn = async () => {
    if (!newColumnName.trim() || !projectId) return;
    
    const columnName = newColumnName.trim();
    setNewColumnName(''); // Clear input immediately for better UX
    
    try {
      // Don't use optimistic updates - let React Query handle the refetch
      // This ensures we always have the complete, correct data from the API
      await createColumn.mutateAsync({
        projectId,
        data: {
          name: columnName,
          color: '#6366f1',
          position: columns.length,
        },
      });
      
      // The mutation's onSuccess will invalidate and refetch columns
      // The useEffect will then update with all columns including the new one
      // No need to manually update state here
    } catch (error) {
      console.error('Failed to create column:', error);
      toast.error('Failed to create column');
    }
  };
  
  const handleRenameColumn = async (id: string, name: string) => {
    if (!projectId) return;
    try {
      await updateColumn.mutateAsync({
        projectId,
        columnId: id,
        data: { name },
      });
      setEditingColumnId(null);
    } catch (error) {
      console.error('Failed to rename column:', error);
      toast.error('Failed to rename column');
    }
  };
  
  const handleDeleteColumn = async (id: string) => {
    if (!projectId) return;
    
    // Check if column has cards
    const columnToDelete = columns.find(col => col.id === id);
    const cardsInColumn = cards.filter(card => card.columnId === id && !card.archived);
    
    if (cardsInColumn.length > 0) {
      // Ask user what to do with cards
      const action = confirm(
        `This column has ${cardsInColumn.length} card(s). Do you want to delete the column and all its cards? Click OK to delete, or Cancel to abort.`
      );
      
      if (!action) {
        return; // User cancelled
      }
      
      // Optionally, we could move cards to another column instead
      // For now, we'll delete the column and let the backend handle card deletion
    }
    
    try {
      // Optimistically remove the column from UI
      setColumns(prev => prev.filter(col => col.id !== id));
      
      await deleteColumn.mutateAsync({ projectId, columnId: id });
    } catch (error) {
      console.error('Failed to delete column:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['kanban', 'columns', projectId] });
      toast.error('Failed to delete column');
    }
  };
  
  const setColumnColor = (id: string, color: string) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, color } : col));
    setShowColumnColorPicker(null);
  };
  
  const toggleCollapseColumn = (id: string) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, collapsed: !col.collapsed } : col));
  };
  
  const setWipLimit = (id: string, limit: number) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, wipLimit: limit } : col));
  };
  
  // Card actions
  const archiveCard = async (id: string) => {
    if (!projectId) return;
    try {
      await updateCard.mutateAsync({
        projectId,
        cardId: id,
        data: { archived: true },
      });
    } catch (error) {
      console.error('Failed to archive card:', error);
    }
  };
  
  const unarchiveCard = async (id: string) => {
    if (!projectId) return;
    try {
      await updateCard.mutateAsync({
        projectId,
        cardId: id,
        data: { archived: false },
      });
    } catch (error) {
      console.error('Failed to unarchive card:', error);
    }
  };
  
  const handleDeleteCard = async (id: string) => {
    if (!projectId) return;
    try {
      await deleteCard.mutateAsync({ projectId, cardId: id });
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };
  
  const duplicateCard = async (id: string) => {
    if (!projectId) return;
    const card = cards.find(c => c.id === id);
    if (!card) return;
    
    try {
      // Map priority back to API format
      const priorityMap: Record<string, string> = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Critical': 'critical'
      };

      await createCard.mutateAsync({
        projectId,
        data: {
          title: card.title + ' (Copy)',
          columnId: card.columnId,
          description: card.description,
          status: card.status,
          priority: priorityMap[card.priority] || 'medium',
          dueDate: card.dueDate,
          startDate: card.startDate,
          estimatedHours: card.estimatedHours,
          assignees: card.assignees,
          labels: card.labels,
          subtasks: card.subtasks,
          checklists: card.checklists,
          attachments: card.attachments,
          comments: card.comments,
          dependencies: card.dependencies,
          blockedBy: card.blockedBy,
          blocking: card.blocking,
          customFields: card.customFields,
        },
      });
    } catch (error) {
      console.error('Failed to duplicate card:', error);
    }
  };
  
  // File upload
  const handleFileUpload = (cardId: string, files: FileList) => {
    Array.from(files).forEach(file => {
      const attachment = {
        id: generateId(),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        uploadedBy: 'current-user',
        uploadedAt: new Date().toISOString()
      };
      
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, attachments: [...card.attachments, attachment] }
          : card
      ));
    });
  };
  
  // Export functions
  const exportBoard = (format: 'json' | 'csv' | 'pdf') => {
    const data = { columns, cards, title: boardTitle };
    
    switch (format) {
      case 'json':
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `${boardTitle}.json`;
        jsonLink.click();
        break;
      case 'csv':
        const csvContent = [
          ['Title', 'Column', 'Assignee', 'Priority', 'Due Date', 'Status'].join(','),
          ...cards.map(card => [
            card.title,
            columns.find(col => col.id === card.columnId)?.name || '',
            card.assignee,
            card.priority,
            card.dueDate,
            card.status
          ].join(','))
        ].join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `${boardTitle}.csv`;
        csvLink.click();
        break;
      case 'pdf':
        // In a real app, you'd use a PDF library like jsPDF
        alert('PDF export would be implemented with a PDF library');
        break;
    }
  };
  
  // Format time for display
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  // Responsive column width
  const columnWidth = `min-w-[340px] w-full sm:w-[340px]`;

  // Render main board
  // Handle API errors gracefully
  if (columnsError || cardsError) {
    const error = columnsError || cardsError;
    const is403 = (error as any)?.response?.status === 403;
    const is404 = (error as any)?.response?.status === 404;
    
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {is403 ? 'Access Denied' : is404 ? 'Project Not Found' : 'Unable to Load Board'}
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          {is403 
            ? "You don't have permission to access this project's board. Please contact the project owner to request access."
            : is404
            ? "The project you're looking for doesn't exist or has been deleted."
            : 'There was an error loading the board. Please try refreshing the page.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Simple Board Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-2xl">{boardTitle}</h2>
          <Badge variant="outline" className="ml-2">
            {filteredCards.length} cards
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          
          <Button onClick={() => setShowNewCardDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>
      </div>

      {/* Timer Bar */}
      {activeTimer && (
        <div className="bg-blue-50 border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">
              Tracking time for: {cards.find(c => c.id === activeTimer)?.title}
            </span>
            <Badge variant="outline" className="bg-blue-100">
              {formatTime(elapsedTime)}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={stopTimer}>
            <Pause className="h-4 w-4 mr-2" />
            Stop Timer
          </Button>
        </div>
      )}

      {/* Bulk Selection Bar */}
      {selectedCards.length > 0 && (
        <div className="bg-indigo-50 border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium">
              {selectedCards.length} cards selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkOperation('archive')}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkOperation('delete')}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedCards([])}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Main Board Content */}
      {(
        <div className="flex gap-4 overflow-x-auto p-4 pb-8 h-full">
          {columns.sort((a, b) => a.position - b.position).map((col, colIdx) => {
            const columnCards = filteredCards.filter(card => card.columnId === col.id && !card.archived);
            const wipExceeded = col.wipLimit && columnCards.length > col.wipLimit;
            
            return (
              <div
                key={col.id}
                className={`${columnWidth} flex flex-col bg-white rounded-xl shadow-sm border ${wipExceeded ? 'border-red-300' : 'border-gray-200'} relative`}
                draggable
                onDragStart={() => onColumnDragStart(col.id)}
                onDrop={() => onColumnDrop(colIdx)}
                onDragOver={e => e.preventDefault()}
              >
                {/* Enhanced Column Header */}
                <div className="flex items-center justify-between p-3 rounded-t-xl border-b" style={{ background: col.color }}>
                  <div className="flex items-center gap-2">
                    {editingColumnId === col.id ? (
                      <Input
                        value={newColumnName}
                        onChange={e => setNewColumnName(e.target.value)}
                        onBlur={() => handleRenameColumn(col.id, newColumnName)}
                        onKeyPress={e => e.key === 'Enter' && handleRenameColumn(col.id, newColumnName)}
                        autoFocus
                        className="w-32 text-white bg-transparent border-white"
                      />
                    ) : (
                      <span 
                        className="font-bold text-white text-lg cursor-pointer" 
                        onClick={() => { setEditingColumnId(col.id); setNewColumnName(col.name); }}
                      >
                        {col.name}
                      </span>
                    )}
                    <Badge className={`ml-2 ${wipExceeded ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'}`}>
                      {columnCards.length}{col.wipLimit ? `/${col.wipLimit}` : ''}
                    </Badge>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setShowColumnColorPicker(col.id)}>
                        <Palette className="mr-2 h-4 w-4" />
                        Change Color
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleCollapseColumn(col.id)}>
                        {col.collapsed ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronUp className="mr-2 h-4 w-4" />}
                        {col.collapsed ? 'Expand' : 'Collapse'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingColumnId(col.id)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const limit = prompt('Set WIP limit:', col.wipLimit?.toString() || '');
                        if (limit) setWipLimit(col.id, parseInt(limit));
                      }}>
                        <Target className="mr-2 h-4 w-4" />
                        Set WIP Limit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteColumn(col.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Color Picker */}
                {showColumnColorPicker === col.id && (
                  <div className="flex gap-2 p-2 bg-gray-50 border-b">
                    {['#22c55e', '#f59e42', '#e2445c', '#a78bfa', '#6b7280', '#6366f1', '#38bdf8', '#f43f5e', '#84cc16', '#f97316'].map(color => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                        style={{ background: color }}
                        onClick={() => setColumnColor(col.id, color)}
                      />
                    ))}
                  </div>
                )}

                {/* Cards */}
                {!col.collapsed && (
                  <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto min-h-[60px]">
                    {columnCards.sort((a, b) => a.position - b.position).map(card => (
                      <div
                        key={card.id}
                        className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer border hover:border-indigo-400 transition-all group ${selectedCards.includes(card.id) ? 'ring-2 ring-indigo-500' : ''}`}
                        draggable
                        onDragStart={() => onCardDragStart(card.id)}
                        onDrop={() => onCardDrop(col.id)}
                        onDragOver={e => e.preventDefault()}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            setSelectedCards(prev => 
                              prev.includes(card.id) 
                                ? prev.filter(id => id !== card.id)
                                : [...prev, card.id]
                            );
                          } else {
                            setShowCardDetails(card);
                          }
                        }}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1">
                            {card.title}
                          </h3>
                          <div className="flex items-center gap-1 ml-2">
                            {card.priority && (
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
                                title={`${card.priority} Priority`}
                              />
                            )}
                            {selectedCards.includes(card.id) && (
                              <CheckSquare className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                        </div>

                        {/* Card Description */}
                        {card.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {card.description}
                          </p>
                        )}

                        {/* Card Labels */}
                        {card.labels && card.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {card.labels.slice(0, 3).map(label => (
                              <Badge key={label} variant="secondary" className="text-xs px-1 py-0">
                                {label}
                              </Badge>
                            ))}
                            {card.labels.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{card.labels.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Card Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            {card.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{card.assignee}</span>
                              </div>
                            )}
                            {card.dueDate && (
                              <div className={`flex items-center gap-1 ${new Date(card.dueDate) < new Date() ? 'text-red-500' : ''}`}>
                                <Calendar className="h-3 w-3" />
                                <span>{card.dueDate}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {card.comments && card.comments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{card.comments.length}</span>
                              </div>
                            )}
                            {card.attachments && card.attachments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                <span>{card.attachments.length}</span>
                              </div>
                            )}
                            {card.subtasks && card.subtasks.length > 0 && (
                              <div className="flex items-center gap-1">
                                <ListChecks className="h-3 w-3" />
                                <span>{card.subtasks.filter(st => st.done).length}/{card.subtasks.length}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar for Subtasks */}
                        {card.subtasks && card.subtasks.length > 0 && (
                          <div className="mt-2">
                            <Progress 
                              value={(card.subtasks.filter(st => st.done).length / card.subtasks.length) * 100}
                              className="h-1"
                            />
                          </div>
                        )}

                        {/* Time Tracking */}
                        {(card.estimatedHours > 0 || card.actualHours > 0) && (
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{card.actualHours.toFixed(1)}h / {card.estimatedHours}h</span>
                            </div>
                            {activeTimer === card.id ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopTimer();
                                }}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                {formatTime(elapsedTime)}
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startTimer(card.id);
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                          </div>
                        )}

                        {/* AI Suggestions Indicator */}
                        {card.aiSuggestions && card.aiSuggestions.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                            <Lightbulb className="h-3 w-3" />
                            <span>{card.aiSuggestions.length} AI suggestions</span>
                          </div>
                        )}

                        {/* Card Actions (Hidden by default, shown on hover) */}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCard(card);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateCard(card.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveCard(card.id);
                            }}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${card.title}"?`)) {
                                handleDeleteCard(card.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add Task Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 justify-start mt-2 border-dashed border-2 border-gray-200 hover:border-gray-300"
                      onClick={() => { 
                        setNewCard({ columnId: col.id }); 
                        setShowNewCardDialog(true); 
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add task
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Column */}
          <div className={`${columnWidth} flex flex-col items-center justify-center bg-gray-100 rounded-xl border border-dashed border-gray-300 min-h-[200px] hover:bg-gray-50 transition-colors`}>
            <Input
              value={newColumnName}
              onChange={e => setNewColumnName(e.target.value)}
              placeholder="New column name"
              className="mb-2 w-48"
              onKeyPress={e => e.key === 'Enter' && handleAddColumn()}
            />
            <Button onClick={handleAddColumn} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Card Details Modal */}
      <Dialog open={!!showCardDetails} onOpenChange={() => setShowCardDetails(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {showCardDetails && (
            <>
              <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">{showCardDetails.title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingCard(showCardDetails);
                    setShowCardDetails(null);
                  }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => duplicateCard(showCardDetails.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${showCardDetails.title}"?`)) {
                        handleDeleteCard(showCardDetails.id);
                        setShowCardDetails(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => archiveCard(showCardDetails.id)}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="attachments">Files</TabsTrigger>
                <TabsTrigger value="time">Time</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      value={showCardDetails.description} 
                      readOnly 
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea 
                      value={showCardDetails.notes} 
                      readOnly 
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Badge className="mt-1 block w-fit">{showCardDetails.status}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Badge 
                      className="mt-1 block w-fit" 
                      style={{ backgroundColor: PRIORITY_COLORS[showCardDetails.priority] }}
                    >
                      {showCardDetails.priority}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Risk Level</label>
                    <Badge className="mt-1 block w-fit">{showCardDetails.riskLevel}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Assignee</label>
                    <div className="mt-1 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{showCardDetails.assignee || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{showCardDetails.dueDate || 'No due date'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{showCardDetails.startDate || 'No start date'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Story Points</label>
                    <div className="mt-1">{showCardDetails.storyPoints || 0}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Business Value</label>
                    <div className="mt-1">{showCardDetails.businessValue || 0}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration</label>
                    <div className="mt-1">{showCardDetails.duration} days</div>
                  </div>
                </div>
                
                {showCardDetails.labels && showCardDetails.labels.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Labels</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {showCardDetails.labels.map(label => (
                        <Badge key={label} variant="secondary">{label}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {((showCardDetails.dependencies && showCardDetails.dependencies.length > 0) || 
                  (showCardDetails.blockedBy && showCardDetails.blockedBy.length > 0) || 
                  (showCardDetails.blocking && showCardDetails.blocking.length > 0)) && (
                  <div>
                    <label className="text-sm font-medium">Dependencies</label>
                    <div className="mt-1 space-y-2">
                      {showCardDetails.dependencies && showCardDetails.dependencies.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Depends on:</span>
                          <div className="flex flex-wrap gap-1">
                            {showCardDetails.dependencies.map(dep => (
                              <Badge key={dep} variant="outline">{dep}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {showCardDetails.blockedBy && showCardDetails.blockedBy.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Blocked by:</span>
                          <div className="flex flex-wrap gap-1">
                            {showCardDetails.blockedBy.map(blocker => (
                              <Badge key={blocker} variant="outline" className="border-red-300">{blocker}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {showCardDetails.blocking && showCardDetails.blocking.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Blocking:</span>
                          <div className="flex flex-wrap gap-1">
                            {showCardDetails.blocking.map(blocked => (
                              <Badge key={blocked} variant="outline" className="border-orange-300">{blocked}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="subtasks" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Subtasks</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subtask
                  </Button>
                </div>
                <div className="space-y-2">
                  {showCardDetails.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 border rounded">
                      <input 
                        type="checkbox" 
                        checked={subtask.done}
                        readOnly
                        className="rounded"
                      />
                      <span className={subtask.done ? 'line-through text-gray-500' : ''}>
                        {subtask.text}
                      </span>
                      {subtask.assignee && (
                        <Badge variant="outline" className="ml-auto">
                          {subtask.assignee}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {showCardDetails.subtasks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No subtasks yet</p>
                  )}
                </div>
                
                {showCardDetails.checklists.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Checklists</h3>
                    {showCardDetails.checklists.map(checklist => (
                      <div key={checklist.id} className="border rounded p-3 mb-2">
                        <h4 className="font-medium mb-2">{checklist.title}</h4>
                        <div className="space-y-1">
                          {checklist.items.map(item => (
                            <div key={item.id} className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={item.done}
                                readOnly
                                className="rounded"
                              />
                              <span className={item.done ? 'line-through text-gray-500' : ''}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="comments" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Comments</h3>
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
                <div className="space-y-3">
                  {showCardDetails.comments.map(comment => (
                    <div key={comment.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{comment.user}</span>
                        </div>
                        <span className="text-xs text-gray-500">{comment.date}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                      {comment.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {comment.reactions.map((reaction, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reaction.emoji} {reaction.users.length}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {showCardDetails.comments.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="attachments" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Attachments</h3>
                  <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Add File
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {showCardDetails.attachments.map(attachment => (
                    <div key={attachment.id} className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Paperclip className="h-4 w-4" />
                        <span className="font-medium truncate">{attachment.name}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>Size: {(attachment.size / 1024).toFixed(1)} KB</div>
                        <div>Uploaded by: {attachment.uploadedBy}</div>
                        <div>Date: {attachment.uploadedAt}</div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {showCardDetails.attachments.length === 0 && (
                    <p className="text-gray-500 text-center py-4 col-span-2">No attachments yet</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="time" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Estimated Hours</span>
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-2xl font-bold">{showCardDetails.estimatedHours}h</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Actual Hours</span>
                        <Timer className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-2xl font-bold">{showCardDetails.actualHours.toFixed(1)}h</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Time Entries</h3>
                  {activeTimer === showCardDetails.id ? (
                    <Button variant="outline" size="sm" onClick={stopTimer}>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Timer ({formatTime(elapsedTime)})
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => startTimer(showCardDetails.id)}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Timer
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {showCardDetails.timeEntries.map(entry => (
                    <div key={entry.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{entry.userId}</span>
                        <Badge variant={entry.billable ? "default" : "outline"}>
                          {entry.billable ? 'Billable' : 'Non-billable'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.startTime.toLocaleString()} - {entry.endTime?.toLocaleString() || 'In progress'}
                      </div>
                      {entry.description && (
                        <div className="text-sm mt-1">{entry.description}</div>
                      )}
                    </div>
                  ))}
                  {showCardDetails.timeEntries.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No time entries yet</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ai" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">AI Suggestions</h3>
                  <Button size="sm">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Generate New Suggestions
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {showCardDetails.aiSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="border rounded p-3 bg-blue-50">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">{suggestion}</p>
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm">
                              Apply
                            </Button>
                            <Button variant="ghost" size="sm">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {showCardDetails.aiSuggestions.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No AI suggestions available</p>
                      <p className="text-sm text-gray-400">AI will analyze this card and provide suggestions</p>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm font-medium">Complexity Score</div>
                      <div className="text-lg font-bold">7/10</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm font-medium">Risk Assessment</div>
                      <div className="text-lg font-bold">{showCardDetails.riskLevel}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          
          {editingCard && (
            <>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="planning">Planning</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={editingCard.title || ''}
                      onChange={e => setEditingCard({ ...editingCard, title: e.target.value })}
                      placeholder="Enter card title"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editingCard.description || ''}
                      onChange={e => setEditingCard({ ...editingCard, description: e.target.value })}
                      placeholder="Enter card description"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Column *</label>
                      <Select 
                        value={editingCard.columnId || ''} 
                        onValueChange={value => setEditingCard({ ...editingCard, columnId: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(col => (
                            <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select 
                        value={editingCard.priority || 'Medium'} 
                        onValueChange={value => setEditingCard({ ...editingCard, priority: value as any })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Assignee</label>
                      <Input
                        value={editingCard.assignee || ''}
                        onChange={e => setEditingCard({ ...editingCard, assignee: e.target.value })}
                        placeholder="Enter assignee"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Input
                        value={editingCard.status || ''}
                        onChange={e => setEditingCard({ ...editingCard, status: e.target.value })}
                        placeholder="Enter status"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={editingCard.startDate || ''}
                        onChange={e => setEditingCard({ ...editingCard, startDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={editingCard.dueDate || ''}
                        onChange={e => setEditingCard({ ...editingCard, dueDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Labels</label>
                    <Input
                      value={editingCard.labels?.join(', ') || ''}
                      onChange={e => setEditingCard({ ...editingCard, labels: e.target.value.split(', ').filter(Boolean) })}
                      placeholder="Enter labels separated by commas"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={editingCard.notes || ''}
                      onChange={e => setEditingCard({ ...editingCard, notes: e.target.value })}
                      placeholder="Enter additional notes"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="planning" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Duration (days)</label>
                      <Input
                        type="number"
                        value={editingCard.duration || 0}
                        onChange={e => setEditingCard({ ...editingCard, duration: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Estimated Hours</label>
                      <Input
                        type="number"
                        value={editingCard.estimatedHours || 0}
                        onChange={e => setEditingCard({ ...editingCard, estimatedHours: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Actual Hours</label>
                      <Input
                        type="number"
                        value={editingCard.actualHours || 0}
                        onChange={e => setEditingCard({ ...editingCard, actualHours: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Dependencies</label>
                    <Input
                      value={editingCard.dependencies?.join(', ') || ''}
                      onChange={e => setEditingCard({ ...editingCard, dependencies: e.target.value.split(', ').filter(Boolean) })}
                      placeholder="Enter card IDs separated by commas"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setEditingCard(null)}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  if (!editingCard.title?.trim()) {
                    toast.error('Title is required');
                    return;
                  }
                  
                  try {
                    // Map column ID to status
                    let status: Task['status'] = 'todo';
                    if (editingCard.columnId === 'todo') status = 'todo';
                    else if (editingCard.columnId === 'working') status = 'in-progress';
                    else if (editingCard.columnId === 'review') status = 'review';
                    else if (editingCard.columnId === 'done') status = 'done';
                    else if (editingCard.columnId === 'backlog') status = 'blocked';

                    // Map priority
                    const priorityMap: Record<string, Task['priority']> = {
                      'Low': 'low',
                      'Medium': 'medium',
                      'High': 'high',
                      'Critical': 'critical'
                    };

                    await updateTask.mutateAsync({
                      id: editingCard.id,
                      data: {
                        title: editingCard.title,
                        description: editingCard.description || editingCard.notes,
                        status,
                        priority: priorityMap[editingCard.priority] || 'medium',
                        dueDate: editingCard.dueDate ? new Date(editingCard.dueDate).toISOString() : undefined,
                        estimatedHours: editingCard.estimatedHours,
                        actualHours: editingCard.actualHours,
                        tags: editingCard.labels
                      }
                    });

                    setCards(prev => prev.map(card => 
                      card.id === editingCard.id ? { ...editingCard, updatedAt: new Date().toISOString() } : card
                    ));
                    setEditingCard(null);
                    toast.success('Card updated successfully');
                  } catch (error) {
                    console.error('Failed to update card:', error);
                    toast.error('Failed to update card');
                  }
                }}>
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced New Card Dialog */}
      <Dialog open={showNewCardDialog} onOpenChange={(open) => {
        setShowNewCardDialog(open);
        if (open && columns.length > 0 && !newCard.columnId) {
          // Auto-select first column when dialog opens
          setNewCard({ ...newCard, columnId: columns[0].id });
        }
      }}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create New Card</DialogTitle>
          </DialogHeader>
          
          {columnsLoading || columns.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading columns... Please wait.</p>
            </div>
          ) : (
          <>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newCard.title || ''}
                  onChange={e => setNewCard({ ...newCard, title: e.target.value })}
                  placeholder="Enter card title"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newCard.description || ''}
                  onChange={e => setNewCard({ ...newCard, description: e.target.value })}
                  placeholder="Enter card description"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Column *</label>
                  {columns.length === 0 ? (
                    <div className="mt-1 text-sm text-muted-foreground">
                      Loading columns... Please wait.
                    </div>
                  ) : (
                    <Select 
                      value={newCard.columnId || (columns[0]?.id || '')} 
                      onValueChange={value => setNewCard({ ...newCard, columnId: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={newCard.priority || 'Medium'} 
                    onValueChange={value => setNewCard({ ...newCard, priority: value as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Assignee</label>
                  <Input
                    value={newCard.assignee || ''}
                    onChange={e => setNewCard({ ...newCard, assignee: e.target.value })}
                    placeholder="Enter assignee"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Input
                    value={newCard.status || ''}
                    onChange={e => setNewCard({ ...newCard, status: e.target.value })}
                    placeholder="Enter status"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newCard.startDate || ''}
                    onChange={e => setNewCard({ ...newCard, startDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newCard.dueDate || ''}
                    onChange={e => setNewCard({ ...newCard, dueDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Labels</label>
                <Input
                  value={newCard.labels?.join(', ') || ''}
                  onChange={e => setNewCard({ ...newCard, labels: e.target.value.split(', ').filter(Boolean) })}
                  placeholder="Enter labels separated by commas"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={newCard.notes || ''}
                  onChange={e => setNewCard({ ...newCard, notes: e.target.value })}
                  placeholder="Enter additional notes"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="planning" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration (days)</label>
                  <Input
                    type="number"
                    value={newCard.duration || ''}
                    onChange={e => setNewCard({ ...newCard, duration: Number(e.target.value) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Estimated Hours</label>
                  <Input
                    type="number"
                    value={newCard.estimatedHours || ''}
                    onChange={e => setNewCard({ ...newCard, estimatedHours: Number(e.target.value) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Story Points</label>
                  <Input
                    type="number"
                    value={newCard.storyPoints || ''}
                    onChange={e => setNewCard({ ...newCard, storyPoints: Number(e.target.value) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Business Value</label>
                  <Input
                    type="number"
                    value={newCard.businessValue || ''}
                    onChange={e => setNewCard({ ...newCard, businessValue: Number(e.target.value) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Risk Level</label>
                  <Select 
                    value={newCard.riskLevel || 'Low'} 
                    onValueChange={value => setNewCard({ ...newCard, riskLevel: value as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Epic</label>
                  <Input
                    value={newCard.epic || ''}
                    onChange={e => setNewCard({ ...newCard, epic: e.target.value })}
                    placeholder="Enter epic"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Sprint</label>
                  <Input
                    value={newCard.sprint || ''}
                    onChange={e => setNewCard({ ...newCard, sprint: e.target.value })}
                    placeholder="Enter sprint"
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Component</label>
                  <Input
                    value={newCard.component || ''}
                    onChange={e => setNewCard({ ...newCard, component: e.target.value })}
                    placeholder="Enter component"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <Input
                    value={newCard.version || ''}
                    onChange={e => setNewCard({ ...newCard, version: e.target.value })}
                    placeholder="Enter version"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fix Version</label>
                  <Input
                    value={newCard.fixVersion || ''}
                    onChange={e => setNewCard({ ...newCard, fixVersion: e.target.value })}
                    placeholder="Enter fix version"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Environment</label>
                  <Input
                    value={newCard.environment || ''}
                    onChange={e => setNewCard({ ...newCard, environment: e.target.value })}
                    placeholder="Enter environment"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newCard.recurring || false}
                  onCheckedChange={checked => setNewCard({ ...newCard, recurring: checked })}
                />
                <label className="text-sm font-medium">Recurring Task</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newCard.isTemplate || false}
                  onCheckedChange={checked => setNewCard({ ...newCard, isTemplate: checked })}
                />
                <label className="text-sm font-medium">Save as Template</label>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowNewCardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCard} disabled={!newCard.title || !newCard.columnId || columns.length === 0}>
              Create Card
            </Button>
          </div>
          </>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Filter Cards</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assignees</label>
              <Input
                placeholder="Enter assignees (comma separated)"
                value={filters.assignees.join(', ')}
                onChange={e => setFilters({ ...filters, assignees: e.target.value.split(', ').filter(Boolean) })}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Labels</label>
              <Input
                placeholder="Enter labels (comma separated)"
                value={filters.labels.join(', ')}
                onChange={e => setFilters({ ...filters, labels: e.target.value.split(', ').filter(Boolean) })}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Priorities</label>
              <div className="mt-1 space-y-2">
                {Object.keys(PRIORITY_COLORS).map(priority => (
                  <div key={priority} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFilters({ ...filters, priorities: [...filters.priorities, priority] });
                        } else {
                          setFilters({ ...filters, priorities: filters.priorities.filter(p => p !== priority) });
                        }
                      }}
                    />
                    <label className="text-sm">{priority}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Due Date From</label>
                <Input
                  type="date"
                  value={filters.dueDateRange.start || ''}
                  onChange={e => setFilters({ 
                    ...filters, 
                    dueDateRange: { ...filters.dueDateRange, start: e.target.value }
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date To</label>
                <Input
                  type="date"
                  value={filters.dueDateRange.end || ''}
                  onChange={e => setFilters({ 
                    ...filters, 
                    dueDateRange: { ...filters.dueDateRange, end: e.target.value }
                  })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments}
                  onChange={e => setFilters({ ...filters, hasAttachments: e.target.checked })}
                />
                <label className="text-sm">Has Attachments</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasComments}
                  onChange={e => setFilters({ ...filters, hasComments: e.target.checked })}
                />
                <label className="text-sm">Has Comments</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasSubtasks}
                  onChange={e => setFilters({ ...filters, hasSubtasks: e.target.checked })}
                />
                <label className="text-sm">Has Subtasks</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.archived}
                  onChange={e => setFilters({ ...filters, archived: e.target.checked })}
                />
                <label className="text-sm">Show Archived</label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  assignees: [],
                  labels: [],
                  priorities: [],
                  dueDateRange: {},
                  createdDateRange: {},
                  archived: false,
                  hasAttachments: false,
                  hasComments: false,
                  hasSubtasks: false,
                  riskLevels: [],
                  businessValueRange: {},
                  storyPointsRange: {}
                })}
              >
                Clear All
              </Button>
              <Button onClick={() => setShowFilterDialog(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Choose Board Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BOARD_TEMPLATES.map(template => (
              <Card key={template.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => applyTemplate(template.id)}>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {template.cards.length} cards, {template.columns.length} columns
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Automation Dialog */}
      <Dialog open={showAutomationDialog} onOpenChange={setShowAutomationDialog}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Automation Rules</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Active Rules</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
            
            <div className="space-y-3">
              {automationRules.map(rule => (
                <div key={rule.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{rule.name}</span>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.enabled} />
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    When {rule.trigger.replace('_', ' ')}, then {rule.action.replace('_', ' ')}
                  </p>
                </div>
              ))}
              {automationRules.length === 0 && (
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No automation rules yet</p>
                  <p className="text-sm text-gray-400">Create rules to automate your workflow</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-4xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Board Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Cards</p>
                      <p className="text-2xl font-bold">{calculateAnalytics.totalCards}</p>
                    </div>
                    <ListChecks className="h-8 w-8 text-blue-600 ml-auto" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold">{calculateAnalytics.completedCards}</p>
                    </div>
                    <CheckSquare className="h-8 w-8 text-green-600 ml-auto" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold">{calculateAnalytics.overdueTasks}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600 ml-auto" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                      <p className="text-2xl font-bold">{calculateAnalytics.averageCompletionTime.toFixed(1)}d</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Column Distribution</h3>
                  <div className="space-y-3">
                    {columns.map(column => {
                      const columnCards = cards.filter(card => card.columnId === column.id);
                      const percentage = cards.length > 0 ? (columnCards.length / cards.length) * 100 : 0;
                      return (
                        <div key={column.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{column.name}</span>
                            <span>{columnCards.length} cards ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Priority Distribution</h3>
                  <div className="space-y-3">
                    {Object.keys(PRIORITY_COLORS).map(priority => {
                      const priorityCards = cards.filter(card => card.priority === priority);
                      const percentage = cards.length > 0 ? (priorityCards.length / cards.length) * 100 : 0;
                      return (
                        <div key={priority}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{priority}</span>
                            <span>{priorityCards.length} cards ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={showBulkOperationsDialog} onOpenChange={setShowBulkOperationsDialog}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select cards by holding Ctrl/Cmd and clicking on them, then choose an operation:
            </p>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleBulkOperation('archive')}
                disabled={selectedCards.length === 0}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Selected Cards ({selectedCards.length})
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleBulkOperation('delete')}
                disabled={selectedCards.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected Cards ({selectedCards.length})
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleBulkOperation('assign')}
                disabled={selectedCards.length === 0}
              >
                <User className="h-4 w-4 mr-2" />
                Assign to User
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleBulkOperation('add_label')}
                disabled={selectedCards.length === 0}
              >
                <Tag className="h-4 w-4 mr-2" />
                Add Label
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleBulkOperation('move')}
                disabled={selectedCards.length === 0}
              >
                <Move className="h-4 w-4 mr-2" />
                Move to Column
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Tracking Dialog */}
      <Dialog open={showTimeTrackingDialog} onOpenChange={setShowTimeTrackingDialog}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Time Tracking</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Logged</p>
                      <p className="text-2xl font-bold">
                        {timeEntries.reduce((sum, entry) => {
                          if (entry.endTime) {
                            return sum + (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
                          }
                          return sum;
                        }, 0).toFixed(1)}h
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Billable Hours</p>
                      <p className="text-2xl font-bold">
                        {timeEntries.filter(entry => entry.billable).reduce((sum, entry) => {
                          if (entry.endTime) {
                            return sum + (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
                          }
                          return sum;
                        }, 0).toFixed(1)}h
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Timer</p>
                      <p className="text-2xl font-bold">
                        {activeTimer ? formatTime(elapsedTime) : '00:00'}
                      </p>
                    </div>
                    <Timer className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Recent Time Entries</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeEntries.slice(-10).reverse().map(entry => {
                  const card = cards.find(c => c.id === entry.cardId);
                  const duration = entry.endTime 
                    ? (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60)
                    : 0;
                  
                  return (
                    <div key={entry.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{card?.title || 'Unknown Card'}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={entry.billable ? "default" : "outline"}>
                            {entry.billable ? 'Billable' : 'Non-billable'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.startTime.toLocaleString()} - {entry.endTime?.toLocaleString() || 'In progress'}
                      </div>
                      {entry.description && (
                        <div className="text-sm mt-1">{entry.description}</div>
                      )}
                    </div>
                  );
                })}
                {timeEntries.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No time entries yet</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Board Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Board Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Board Title</label>
              <Input
                value={boardTitle}
                onChange={e => setBoardTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Board Description</label>
              <Textarea
                value={boardDescription}
                onChange={e => setBoardDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable WIP Limits</label>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Card IDs</label>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-archive Completed</label>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Time Tracking</label>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">AI Suggestions</label>
                <Switch defaultChecked />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Danger Zone</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full text-red-600 border-red-300">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Cards
                </Button>
                <Button variant="outline" className="w-full text-red-600 border-red-300">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Board
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for attachments */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => {
          if (e.target.files && showCardDetails) {
            handleFileUpload(showCardDetails.id, e.target.files);
          }
        }}
      />
    </div>
  );
};

export default KanbanBoard; 