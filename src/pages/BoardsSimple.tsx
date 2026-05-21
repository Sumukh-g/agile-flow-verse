/**
 * BoardsSimple - Unified Kanban Board View with Personal Boards
 * 
 * This component provides two types of boards:
 * 1. Project Boards - Synced with project-level Kanban boards
 * 2. Personal Boards - Private boards stored locally for personal use
 * 
 * Features:
 * - Create and manage personal boards (localStorage)
 * - Project-specific Kanban columns from database
 * - Real-time synchronization with project boards
 * - Drag and drop card management
 * - Beautiful, consistent styling
 * 
 * @author AgileFlowVerse Team
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  useKanbanColumns, 
  useKanbanCards, 
  useCreateKanbanColumn,
  useCreateKanbanCard,
  useUpdateKanbanCard,
  useDeleteKanbanColumn,
  useMoveKanbanCard
} from '@/hooks/useKanban';
import { useProjects } from '@/hooks/useProjects';
import { 
  LayoutGrid, 
  Plus, 
  GripVertical, 
  Clock, 
  MoreHorizontal,
  Trash2,
  Edit2,
  AlertCircle,
  Folder,
  User,
  Star,
  StarOff,
  Settings,
  Copy,
  Archive
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Personal board structure stored in localStorage
 */
interface PersonalBoard {
  id: string;
  name: string;
  description: string;
  color: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
  columns: PersonalColumn[];
}

/**
 * Column within a personal board
 */
interface PersonalColumn {
  id: string;
  name: string;
  color: string;
  position: number;
  cards: PersonalCard[];
}

/**
 * Card within a personal column
 */
interface PersonalCard {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  labels: string[];
  position: number;
  createdAt: string;
}

/**
 * API Kanban types
 */
interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  priority: string;
  dueDate?: string;
  assignees: string[];
  labels: string[];
  position: number;
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * localStorage key for personal boards
 */
const PERSONAL_BOARDS_KEY = 'kanban-personal-boards';

/**
 * Available colors for columns and boards
 */
const COLORS = [
  { name: 'Slate', value: '#64748b' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
];

/**
 * Priority colors for badges
 */
const PRIORITY_COLORS: Record<string, string> = {
  'low': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'medium': 'bg-amber-100 text-amber-800 border-amber-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'critical': 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Default columns for new personal boards
 */
const DEFAULT_PERSONAL_COLUMNS: Omit<PersonalColumn, 'id'>[] = [
  { name: 'To Do', color: '#3b82f6', position: 0, cards: [] },
  { name: 'In Progress', color: '#f59e0b', position: 1, cards: [] },
  { name: 'Done', color: '#22c55e', position: 2, cards: [] },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Load personal boards from localStorage
 */
const loadPersonalBoards = (): PersonalBoard[] => {
  try {
    const data = localStorage.getItem(PERSONAL_BOARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load personal boards:', error);
    return [];
  }
};

/**
 * Save personal boards to localStorage
 */
const savePersonalBoards = (boards: PersonalBoard[]): void => {
  try {
    localStorage.setItem(PERSONAL_BOARDS_KEY, JSON.stringify(boards));
  } catch (error) {
    console.error('Failed to save personal boards:', error);
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BoardsSimple: React.FC = () => {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  
  // Tab state - project boards vs personal boards
  const [activeTab, setActiveTab] = useState<'project' | 'personal'>('project');
  
  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Personal boards state
  const [personalBoards, setPersonalBoards] = useState<PersonalBoard[]>([]);
  const [selectedPersonalBoardId, setSelectedPersonalBoardId] = useState<string>('');
  
  // Dialog states
  const [newCardDialogOpen, setNewCardDialogOpen] = useState(false);
  const [newColumnDialogOpen, setNewColumnDialogOpen] = useState(false);
  const [editCardDialogOpen, setEditCardDialogOpen] = useState(false);
  const [newBoardDialogOpen, setNewBoardDialogOpen] = useState(false);
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false);
  
  // New card form
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    columnId: '',
  });
  
  // New column form
  const [newColumn, setNewColumn] = useState({
    name: '',
    color: '#3b82f6',
  });
  
  // New board form
  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    color: '#6366f1',
  });
  
  // Selected card for editing
  const [selectedCard, setSelectedCard] = useState<PersonalCard | KanbanCard | null>(null);
  const [selectedCardColumnId, setSelectedCardColumnId] = useState<string>('');

  // -------------------------------------------------------------------------
  // DATA FETCHING - Project Boards
  // -------------------------------------------------------------------------
  
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  
  const { 
    data: projectColumns = [], 
    isLoading: columnsLoading,
    refetch: refetchColumns 
  } = useKanbanColumns(selectedProjectId || undefined);
  
  const { 
    data: projectCards = [], 
    isLoading: cardsLoading,
    refetch: refetchCards 
  } = useKanbanCards(selectedProjectId || undefined);

  // -------------------------------------------------------------------------
  // MUTATIONS - Project Boards
  // -------------------------------------------------------------------------
  
  const createProjectColumn = useCreateKanbanColumn();
  const deleteProjectColumn = useDeleteKanbanColumn();
  const createProjectCard = useCreateKanbanCard();
  const updateProjectCard = useUpdateKanbanCard();
  const moveProjectCard = useMoveKanbanCard();

  // -------------------------------------------------------------------------
  // EFFECTS
  // -------------------------------------------------------------------------
  
  // Load personal boards from localStorage on mount
  useEffect(() => {
    const boards = loadPersonalBoards();
    setPersonalBoards(boards);
    
    // Auto-select first personal board if exists
    if (boards.length > 0 && !selectedPersonalBoardId) {
      setSelectedPersonalBoardId(boards[0].id);
    }
  }, []);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Refetch project data when project changes
  useEffect(() => {
    if (selectedProjectId) {
      refetchColumns();
      refetchCards();
    }
  }, [selectedProjectId, refetchColumns, refetchCards]);

  // -------------------------------------------------------------------------
  // PERSONAL BOARD HANDLERS
  // -------------------------------------------------------------------------
  
  /**
   * Create a new personal board
   */
  const handleCreatePersonalBoard = () => {
    if (!newBoard.name.trim()) {
      toast.error('Please enter a board name');
      return;
    }

    const board: PersonalBoard = {
      id: generateId(),
      name: newBoard.name,
      description: newBoard.description,
      color: newBoard.color,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: DEFAULT_PERSONAL_COLUMNS.map((col, idx) => ({
        ...col,
        id: generateId(),
        position: idx,
        cards: [],
      })),
    };

    const updatedBoards = [...personalBoards, board];
    setPersonalBoards(updatedBoards);
    savePersonalBoards(updatedBoards);
    setSelectedPersonalBoardId(board.id);
    setNewBoard({ name: '', description: '', color: '#6366f1' });
    setNewBoardDialogOpen(false);
    toast.success('Personal board created!');
  };

  /**
   * Delete a personal board
   */
  const handleDeletePersonalBoard = (boardId: string) => {
    const updatedBoards = personalBoards.filter(b => b.id !== boardId);
    setPersonalBoards(updatedBoards);
    savePersonalBoards(updatedBoards);
    
    if (selectedPersonalBoardId === boardId) {
      setSelectedPersonalBoardId(updatedBoards[0]?.id || '');
    }
    
    toast.success('Board deleted');
  };

  /**
   * Toggle board star
   */
  const handleToggleStar = (boardId: string) => {
    const updatedBoards = personalBoards.map(b =>
      b.id === boardId ? { ...b, starred: !b.starred } : b
    );
    setPersonalBoards(updatedBoards);
    savePersonalBoards(updatedBoards);
  };

  /**
   * Duplicate a personal board
   */
  const handleDuplicateBoard = (boardId: string) => {
    const board = personalBoards.find(b => b.id === boardId);
    if (!board) return;

    const newBoardCopy: PersonalBoard = {
      ...board,
      id: generateId(),
      name: `${board.name} (Copy)`,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: board.columns.map(col => ({
        ...col,
        id: generateId(),
        cards: col.cards.map(card => ({
          ...card,
          id: generateId(),
          createdAt: new Date().toISOString(),
        })),
      })),
    };

    const updatedBoards = [...personalBoards, newBoardCopy];
    setPersonalBoards(updatedBoards);
    savePersonalBoards(updatedBoards);
    toast.success('Board duplicated!');
  };

  /**
   * Get current selected personal board
   */
  const selectedPersonalBoard = personalBoards.find(b => b.id === selectedPersonalBoardId);

  /**
   * Update personal board data
   */
  const updatePersonalBoard = useCallback((updater: (board: PersonalBoard) => PersonalBoard) => {
    if (!selectedPersonalBoardId) return;
    
    const updatedBoards = personalBoards.map(b =>
      b.id === selectedPersonalBoardId 
        ? { ...updater(b), updatedAt: new Date().toISOString() }
        : b
    );
    setPersonalBoards(updatedBoards);
    savePersonalBoards(updatedBoards);
  }, [personalBoards, selectedPersonalBoardId]);

  // -------------------------------------------------------------------------
  // COLUMN HANDLERS - Both Board Types
  // -------------------------------------------------------------------------
  
  /**
   * Create a new column
   */
  const handleCreateColumn = async () => {
    if (!newColumn.name.trim()) {
      toast.error('Please enter a column name');
      return;
    }

    if (activeTab === 'project') {
      if (!selectedProjectId) {
        toast.error('Please select a project first');
        return;
      }
      
      try {
        await createProjectColumn.mutateAsync({
          projectId: selectedProjectId,
          data: {
            name: newColumn.name,
            color: newColumn.color,
          },
        });
      } catch (error) {
        console.error('Failed to create column:', error);
        return;
      }
    } else {
      // Personal board column
      if (!selectedPersonalBoard) {
        toast.error('Please select a board first');
        return;
      }

      updatePersonalBoard(board => ({
        ...board,
        columns: [
          ...board.columns,
          {
            id: generateId(),
            name: newColumn.name,
            color: newColumn.color,
            position: board.columns.length,
            cards: [],
          },
        ],
      }));
      toast.success('Column created!');
    }

    setNewColumn({ name: '', color: '#3b82f6' });
    setNewColumnDialogOpen(false);
  };

  /**
   * Delete a column
   */
  const handleDeleteColumn = async (columnId: string) => {
    if (activeTab === 'project') {
      if (!selectedProjectId) return;
      
      const otherColumn = projectColumns.find((c: KanbanColumn) => c.id !== columnId);
      
      try {
        await deleteProjectColumn.mutateAsync({
          projectId: selectedProjectId,
          columnId,
          moveToColumnId: otherColumn?.id,
        });
      } catch (error) {
        console.error('Failed to delete column:', error);
      }
    } else {
      if (!selectedPersonalBoard) return;
      
      if (selectedPersonalBoard.columns.length <= 1) {
        toast.error('Cannot delete the last column');
        return;
      }

      // Move cards to first remaining column
      const targetColumn = selectedPersonalBoard.columns.find(c => c.id !== columnId);
      
      updatePersonalBoard(board => {
        const deletingColumn = board.columns.find(c => c.id === columnId);
        const cardsToMove = deletingColumn?.cards || [];
        
        return {
          ...board,
          columns: board.columns
            .filter(c => c.id !== columnId)
            .map(c => 
              c.id === targetColumn?.id 
                ? { ...c, cards: [...c.cards, ...cardsToMove] }
                : c
            )
            .map((c, idx) => ({ ...c, position: idx })),
        };
      });
      toast.success('Column deleted');
    }
  };

  // -------------------------------------------------------------------------
  // CARD HANDLERS - Both Board Types
  // -------------------------------------------------------------------------
  
  /**
   * Create a new card
   */
  const handleCreateCard = async () => {
    if (!newCard.title.trim()) {
      toast.error('Please enter a card title');
      return;
    }
    
    if (!newCard.columnId) {
      toast.error('Please select a column');
      return;
    }

    if (activeTab === 'project') {
      if (!selectedProjectId) {
        toast.error('Please select a project first');
        return;
      }

      try {
        await createProjectCard.mutateAsync({
          projectId: selectedProjectId,
          data: {
            title: newCard.title,
            description: newCard.description,
            priority: newCard.priority,
            columnId: newCard.columnId,
            assignees: [],
            labels: [],
          },
        });
      } catch (error) {
        console.error('Failed to create card:', error);
        return;
      }
    } else {
      if (!selectedPersonalBoard) {
        toast.error('Please select a board first');
        return;
      }

      const card: PersonalCard = {
        id: generateId(),
        title: newCard.title,
        description: newCard.description,
        priority: newCard.priority,
        labels: [],
        position: 0,
        createdAt: new Date().toISOString(),
      };

      updatePersonalBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === newCard.columnId
            ? { 
                ...col, 
                cards: [card, ...col.cards].map((c, idx) => ({ ...c, position: idx }))
              }
            : col
        ),
      }));
      toast.success('Card created!');
    }

    setNewCard({ title: '', description: '', priority: 'medium', columnId: '' });
    setNewCardDialogOpen(false);
  };

  /**
   * Update a card
   */
  const handleUpdateCard = async () => {
    if (!selectedCard) return;

    if (activeTab === 'project') {
      if (!selectedProjectId) return;

      try {
        await updateProjectCard.mutateAsync({
          projectId: selectedProjectId,
          cardId: selectedCard.id,
          data: {
            title: selectedCard.title,
            description: selectedCard.description,
            priority: selectedCard.priority,
          },
        });
      } catch (error) {
        console.error('Failed to update card:', error);
        return;
      }
    } else {
      updatePersonalBoard(board => ({
        ...board,
        columns: board.columns.map(col => ({
          ...col,
          cards: col.cards.map(card =>
            card.id === selectedCard.id
              ? { ...card, ...selectedCard as PersonalCard }
              : card
          ),
        })),
      }));
      toast.success('Card updated!');
    }

    setEditCardDialogOpen(false);
    setSelectedCard(null);
  };

  /**
   * Delete a card
   */
  const handleDeleteCard = () => {
    if (!selectedCard) return;

    if (activeTab === 'personal') {
      updatePersonalBoard(board => ({
        ...board,
        columns: board.columns.map(col => ({
          ...col,
          cards: col.cards
            .filter(card => card.id !== selectedCard.id)
            .map((c, idx) => ({ ...c, position: idx })),
        })),
      }));
      toast.success('Card deleted');
    }

    setEditCardDialogOpen(false);
    setSelectedCard(null);
  };

  /**
   * Move card to a different column
   */
  const handleMoveCard = async (cardId: string, targetColumnId: string) => {
    if (activeTab === 'project') {
      if (!selectedProjectId) return;

      try {
        await moveProjectCard.mutateAsync({
          projectId: selectedProjectId,
          cardId,
          targetColumnId,
          newPosition: 0,
        });
      } catch (error) {
        console.error('Failed to move card:', error);
      }
    } else {
      updatePersonalBoard(board => {
        // Find the card and its current column
        let cardToMove: PersonalCard | null = null;
        
        const updatedColumns = board.columns.map(col => {
          const card = col.cards.find(c => c.id === cardId);
          if (card) {
            cardToMove = card;
            return {
              ...col,
              cards: col.cards.filter(c => c.id !== cardId),
            };
          }
          return col;
        });

        if (!cardToMove) return board;

        // Add to target column
        return {
          ...board,
          columns: updatedColumns.map(col =>
            col.id === targetColumnId
              ? {
                  ...col,
                  cards: [cardToMove!, ...col.cards].map((c, idx) => ({ ...c, position: idx })),
                }
              : col
          ),
        };
      });
    }
  };

  /**
   * Open card for editing
   */
  const handleCardClick = (card: PersonalCard | KanbanCard, columnId: string) => {
    setSelectedCard(card);
    setSelectedCardColumnId(columnId);
    setEditCardDialogOpen(true);
  };

  /**
   * Open new card dialog with pre-selected column
   */
  const handleAddCardToColumn = (columnId: string) => {
    setNewCard(prev => ({ ...prev, columnId }));
    setNewCardDialogOpen(true);
  };

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------
  
  const getCardsForProjectColumn = (columnId: string): KanbanCard[] => {
    return projectCards
      .filter((card: KanbanCard) => card.columnId === columnId)
      .sort((a: KanbanCard, b: KanbanCard) => a.position - b.position);
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  
  const isLoading = projectsLoading || columnsLoading || cardsLoading;
  const sortedProjectColumns = [...projectColumns].sort((a: KanbanColumn, b: KanbanColumn) => a.position - b.position);
  const sortedPersonalColumns = selectedPersonalBoard?.columns.sort((a, b) => a.position - b.position) || [];

  // Determine which columns to show based on active tab
  const currentColumns = activeTab === 'project' ? sortedProjectColumns : sortedPersonalColumns;

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* HEADER SECTION */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <LayoutGrid className="mr-3 h-7 w-7 text-primary" />
            Kanban Boards
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize and manage tasks with drag-and-drop boards
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'personal' && (
            <Button variant="outline" onClick={() => setNewBoardDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Board
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setNewColumnDialogOpen(true)} 
            disabled={activeTab === 'project' ? !selectedProjectId : !selectedPersonalBoardId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Column
          </Button>
          <Button 
            onClick={() => setNewCardDialogOpen(true)} 
            disabled={activeTab === 'project' ? !selectedProjectId : !selectedPersonalBoardId}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TABS - Project vs Personal */}
      {/* ================================================================== */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'project' | 'personal')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="project" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Project Boards
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Personal Boards
          </TabsTrigger>
        </TabsList>

        {/* ================================================================== */}
        {/* PROJECT BOARDS TAB */}
        {/* ================================================================== */}
        <TabsContent value="project" className="space-y-4">
          {/* Project Filter */}
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Project:</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProjectId && (
              <Badge variant="outline" className="text-xs">
                {projectColumns.length} columns • {projectCards.length} cards
              </Badge>
            )}
          </div>

          {/* No Project Selected */}
          {!selectedProjectId && projects.length > 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Select a Project</p>
                <p className="text-muted-foreground">
                  Choose a project from the dropdown above to view its Kanban board
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Projects */}
          {projects.length === 0 && !projectsLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Folder className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Projects Found</p>
                <p className="text-muted-foreground">
                  Create a project first to start using project boards
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ================================================================== */}
        {/* PERSONAL BOARDS TAB */}
        {/* ================================================================== */}
        <TabsContent value="personal" className="space-y-4">
          {/* Board Selector */}
          <div className="flex gap-4 items-center flex-wrap">
            <label className="text-sm font-medium">Board:</label>
            <Select value={selectedPersonalBoardId} onValueChange={setSelectedPersonalBoardId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {personalBoards
                  .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0))
                  .map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      <div className="flex items-center gap-2">
                        {board.starred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: board.color }}
                        />
                        {board.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {selectedPersonalBoard && (
              <>
                <Badge variant="outline" className="text-xs">
                  {selectedPersonalBoard.columns.length} columns • {selectedPersonalBoard.columns.reduce((acc, col) => acc + col.cards.length, 0)} cards
                </Badge>
                
                {/* Board Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleToggleStar(selectedPersonalBoardId)}>
                      {selectedPersonalBoard.starred ? (
                        <>
                          <StarOff className="w-4 h-4 mr-2" />
                          Remove Star
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Add Star
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateBoard(selectedPersonalBoardId)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Board
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDeletePersonalBoard(selectedPersonalBoardId)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Board
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* No Personal Boards */}
          {personalBoards.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Personal Boards Yet</p>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  Create your own personal Kanban board to organize tasks independently from projects.
                  These boards are private and stored locally on your device.
                </p>
                <Button onClick={() => setNewBoardDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Personal Board
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ================================================================== */}
      {/* KANBAN BOARD - Shared between tabs */}
      {/* ================================================================== */}
      {((activeTab === 'project' && selectedProjectId && !isLoading) || 
        (activeTab === 'personal' && selectedPersonalBoard)) && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {currentColumns.map((column: KanbanColumn | PersonalColumn) => {
            const columnCards = activeTab === 'project' 
              ? getCardsForProjectColumn(column.id)
              : (column as PersonalColumn).cards;
            
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card 
                  className="h-full shadow-sm hover:shadow-md transition-shadow" 
                  style={{ borderTopColor: column.color, borderTopWidth: '3px' }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: column.color }}
                        />
                        {column.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="font-medium">
                          {columnCards.length}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddCardToColumn(column.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Card
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteColumn(column.id)}
                              disabled={currentColumns.length <= 1}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Column
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {columnCards.length === 0 
                        ? 'No tasks' 
                        : `${columnCards.length} task${columnCards.length !== 1 ? 's' : ''}`}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 min-h-[200px]">
                    {columnCards.map((card: KanbanCard | PersonalCard) => (
                      <Card
                        key={card.id}
                        className="hover:shadow-md transition-all cursor-pointer group border-l-4 bg-white dark:bg-slate-900"
                        style={{ borderLeftColor: column.color }}
                        onClick={() => handleCardClick(card, column.id)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {card.title}
                            </h4>
                            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>

                          {card.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {card.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1">
                            <Badge 
                              className={PRIORITY_COLORS[card.priority] || PRIORITY_COLORS['medium']} 
                              variant="outline"
                            >
                              {card.priority}
                            </Badge>
                          </div>

                          {card.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}

                          {/* Quick Move */}
                          <div className="pt-2 border-t">
                            <Select
                              value={activeTab === 'project' ? (card as KanbanCard).columnId : column.id}
                              onValueChange={(value) => handleMoveCard(card.id, value)}
                            >
                              <SelectTrigger 
                                className="h-7 text-xs" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {currentColumns.map((col: KanbanColumn | PersonalColumn) => (
                                  <SelectItem key={col.id} value={col.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-2 h-2 rounded-full" 
                                        style={{ backgroundColor: col.color }}
                                      />
                                      {col.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {columnCards.length === 0 && (
                      <div 
                        className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                        onClick={() => handleAddCardToColumn(column.id)}
                      >
                        <Plus className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p>No tasks in {column.name.toLowerCase()}</p>
                        <p className="text-xs mt-1">Click to add a task</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Add Column Card */}
          <div className="flex-shrink-0 w-80">
            <Card 
              className="h-full min-h-[300px] border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
              onClick={() => setNewColumnDialogOpen(true)}
            >
              <div className="text-center text-muted-foreground">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Add Column</p>
                <p className="text-xs mt-1">Create a new status column</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Loading State */}
      {activeTab === 'project' && isLoading && selectedProjectId && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading board...</p>
        </div>
      )}

      {/* ================================================================== */}
      {/* NEW BOARD DIALOG */}
      {/* ================================================================== */}
      <Dialog open={newBoardDialogOpen} onOpenChange={setNewBoardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Create Personal Board
            </DialogTitle>
            <DialogDescription>
              Create your own private Kanban board. This board is stored locally and only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Board Name *</Label>
              <Input
                id="board-name"
                placeholder="e.g., Personal Tasks, Side Project"
                value={newBoard.name}
                onChange={(e) => setNewBoard(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-description">Description</Label>
              <Textarea
                id="board-description"
                placeholder="What is this board for?"
                value={newBoard.description}
                onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Board Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      newBoard.color === color.value 
                        ? 'border-primary scale-110 shadow-lg ring-2 ring-primary/30' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewBoard(prev => ({ ...prev, color: color.value }))}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBoardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePersonalBoard}>
              Create Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* NEW COLUMN DIALOG */}
      {/* ================================================================== */}
      <Dialog open={newColumnDialogOpen} onOpenChange={setNewColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <DialogDescription>
              Add a new status column to organize your tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-name">Column Name</Label>
              <Input
                id="column-name"
                placeholder="e.g., In Progress, Review, Done"
                value={newColumn.name}
                onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      newColumn.color === color.value 
                        ? 'border-primary scale-110 shadow-lg ring-2 ring-primary/30' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewColumn(prev => ({ ...prev, color: color.value }))}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateColumn} disabled={createProjectColumn.isPending}>
              {createProjectColumn.isPending ? 'Creating...' : 'Create Column'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* NEW CARD DIALOG */}
      {/* ================================================================== */}
      <Dialog open={newCardDialogOpen} onOpenChange={setNewCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your {activeTab === 'project' ? 'project' : 'personal'} board
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-title">Title *</Label>
              <Input
                id="card-title"
                placeholder="Enter task title"
                value={newCard.title}
                onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-description">Description</Label>
              <Textarea
                id="card-description"
                placeholder="Enter task description"
                value={newCard.description}
                onChange={(e) => setNewCard(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Column *</Label>
                <Select 
                  value={newCard.columnId} 
                  onValueChange={(value) => setNewCard(prev => ({ ...prev, columnId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentColumns.map((col: KanbanColumn | PersonalColumn) => (
                      <SelectItem key={col.id} value={col.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: col.color }}
                          />
                          {col.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newCard.priority} 
                  onValueChange={(value) => setNewCard(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' | 'critical' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCard} disabled={createProjectCard.isPending}>
              {createProjectCard.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* EDIT CARD DIALOG */}
      {/* ================================================================== */}
      <Dialog open={editCardDialogOpen} onOpenChange={setEditCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details
            </DialogDescription>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-card-title">Title</Label>
                <Input
                  id="edit-card-title"
                  value={selectedCard.title}
                  onChange={(e) => setSelectedCard(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-card-description">Description</Label>
                <Textarea
                  id="edit-card-description"
                  value={selectedCard.description || ''}
                  onChange={(e) => setSelectedCard(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={selectedCard.priority} 
                  onValueChange={(value) => setSelectedCard(prev => prev ? { ...prev, priority: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            {activeTab === 'personal' && (
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteCard}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditCardDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCard} disabled={updateProjectCard.isPending}>
                {updateProjectCard.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoardsSimple;
