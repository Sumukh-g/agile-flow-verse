import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Activity,
  AlertCircle,
  Brain,
  Calendar,
  Database,
  FileText,
  Filter,
  FormInput,
  Grid3X3,
  List,
  Palette,
  Plus,
  Presentation,
  Search,
  Trello,
  Workflow
} from 'lucide-react';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Lazy load components for better performance
const RichTextEditor = lazy(() => import('@/components/notes/RichTextEditor'));
const NoteSidebar = lazy(() => import('@/components/notes/NoteSidebar'));
const NoteToolbar = lazy(() => import('@/components/notes/NoteToolbar'));
const NoteGallery = lazy(() => import('@/components/notes/NoteGallery'));
const NoteList = lazy(() => import('@/components/notes/NoteList'));
const NoteTemplates = lazy(() => import('@/components/notes/NoteTemplates'));
const NoteCollaboration = lazy(() => import('@/components/notes/NoteCollaboration'));
const NoteAnalytics = lazy(() => import('@/components/notes/NoteAnalytics'));
const NoteAI = lazy(() => import('@/components/notes/NoteAI'));
const NoteDatabase = lazy(() => import('@/components/notes/NoteDatabase'));
const NoteCalendar = lazy(() => import('@/components/notes/NoteCalendar'));
const NoteKanban = lazy(() => import('@/components/notes/NoteKanban'));
const NoteTimeline = lazy(() => import('@/components/notes/NoteTimeline'));
const NoteMindmap = lazy(() => import('@/components/notes/NoteMindmap'));
const NoteWhiteboard = lazy(() => import('@/components/notes/NoteWhiteboard'));
const NotePresentation = lazy(() => import('@/components/notes/NotePresentation'));
const NoteForms = lazy(() => import('@/components/notes/NoteForms'));
const NoteWorkflows = lazy(() => import('@/components/notes/NoteWorkflows'));
const NoteIntegrations = lazy(() => import('@/components/notes/NoteIntegrations'));

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'database' | 'calendar' | 'kanban' | 'timeline' | 'mindmap' | 'whiteboard' | 'presentation' | 'form' | 'workflow';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  pinned: boolean;
  starred: boolean;
  archived: boolean;
  category: string;
  color: string;
  collaborators: string[];
  isPublic: boolean;
  wordCount: number;
  readingTime: number;
  attachments: Attachment[];
  reminders: Date[];
  version: number;
  lastEditedBy: string;
  parentId?: string;
  children?: string[];
  properties: Record<string, any>;
  permissions: Permission[];
  aiGenerated: boolean;
  views: View[];
  currentView: string;
  databaseSchema?: DatabaseSchema;
  workflowSteps?: WorkflowStep[];
  formFields?: FormField[];
  presentationSlides?: Slide[];
  whiteboardElements?: WhiteboardElement[];
  mindmapNodes?: MindmapNode[];
  timelineEvents?: TimelineEvent[];
  kanbanColumns?: KanbanColumn[];
  calendarEvents?: CalendarEvent[];
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'code' | 'table' | 'link' | 'bookmark';
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

interface Permission {
  userId: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  grantedAt: Date;
}

interface View {
  id: string;
  name: string;
  type: 'list' | 'grid' | 'calendar' | 'kanban' | 'timeline' | 'gallery' | 'table' | 'board';
  filters: Filter[];
  sorts: Sort[];
  columns: Column[];
}

interface Filter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'person' | 'file' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by';
  width?: number;
  visible: boolean;
}

interface DatabaseSchema {
  properties: Record<string, PropertyDefinition>;
  relations: Relation[];
}

interface PropertyDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'person' | 'file' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by';
  options?: any[];
  formula?: string;
  rollup?: RollupConfig;
}

interface Relation {
  id: string;
  name: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  sourceProperty: string;
  targetDatabase: string;
  targetProperty: string;
}

interface RollupConfig {
  relationProperty: string;
  targetProperty: string;
  function: 'count' | 'sum' | 'average' | 'min' | 'max' | 'show_original';
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'notification';
  config: Record<string, any>;
  nextSteps: string[];
}

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'radio' | 'file' | 'rating' | 'slider';
  required: boolean;
  options?: any[];
  validation?: ValidationRule[];
}

interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'min_value' | 'max_value' | 'custom';
  value: any;
  message: string;
}

interface Slide {
  id: string;
  title: string;
  content: string;
  background: string;
  transitions: Transition[];
}

interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'flip';
  duration: number;
}

interface WhiteboardElement {
  id: string;
  type: 'text' | 'shape' | 'line' | 'image' | 'sticky' | 'connector';
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
  style: Record<string, any>;
}

interface MindmapNode {
  id: string;
  text: string;
  position: { x: number; y: number };
  children: string[];
  style: Record<string, any>;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: string;
  color: string;
}

interface KanbanColumn {
  id: string;
  name: string;
  items: KanbanItem[];
  color: string;
}

interface KanbanItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location: string;
  attendees: string[];
  color: string;
}

const Notes: React.FC = () => {
  // State management with proper memoization
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'gallery'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'category'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized filtered notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        if (!showArchived && note.archived) return false;
        
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
        
        const matchesTags = selectedTags.length === 0 || 
                           selectedTags.some(tag => note.tags.includes(tag));
        
        return matchesSearch && matchesCategory && matchesTags;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'created':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
          case 'updated':
          default:
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [notes, searchQuery, selectedCategory, selectedTags, sortBy, sortOrder, showArchived]);

  // Load notes from localStorage on mount
  useEffect(() => {
    const loadNotes = () => {
      try {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          const processedNotes = parsedNotes.map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
            reminders: note.reminders?.map((r: string) => new Date(r)) || []
          }));
          setNotes(processedNotes);
        }
      } catch (error) {
        setError('Failed to load notes');
        console.error('Error loading notes:', error);
      }
    };

    loadNotes();
  }, []);

  // Save notes to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  // Handlers
  const handleCreateNote = useCallback((type: Note['type'] = 'text') => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      pinned: false,
      starred: false,
      archived: false,
      category: 'Personal',
      color: 'bg-blue-100',
      collaborators: [],
      isPublic: false,
      wordCount: 0,
      readingTime: 0,
      attachments: [],
      reminders: [],
      version: 1,
      lastEditedBy: 'Current User',
      properties: {},
      permissions: [{ userId: 'current', role: 'owner', grantedAt: new Date() }],
      aiGenerated: false,
      views: [
        {
          id: 'default',
          name: 'Default',
          type: 'list',
          filters: [],
          sorts: [],
          columns: []
        }
      ],
      currentView: 'default'
    };

    setNotes(prev => [newNote, ...prev]);
    setActiveNote(newNote);
    toast.success('Note created successfully');
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
    toast.success('Note deleted');
  }, [activeNote]);

  const handleUpdateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, updatedAt: new Date(), version: note.version + 1 }
        : note
    ));
    
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, ...updates, updatedAt: new Date(), version: prev.version + 1 } : null);
    }
  }, [activeNote]);

  const handleTogglePin = useCallback((noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, pinned: !note.pinned } : note
    ));
    toast.success('Note pin status updated');
  }, []);

  const handleToggleStar = useCallback((noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, starred: !note.starred } : note
    ));
    toast.success('Note star status updated');
  }, []);

  const handleToggleArchive = useCallback((noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, archived: !note.archived } : note
    ));
    toast.success('Note archive status updated');
  }, []);

  const handleShareNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const shareUrl = `${window.location.origin}/notes/${noteId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    }
  }, [notes]);

  const handleExportNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const dataStr = JSON.stringify(note, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${note.title}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Note exported successfully');
    }
  }, [notes]);

  const handleDuplicateNote = useCallback((noteId: string) => {
    const originalNote = notes.find(n => n.id === noteId);
    if (originalNote) {
      const duplicatedNote: Note = {
        ...originalNote,
        id: `note_${Date.now()}`,
        title: `${originalNote.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };
      setNotes(prev => [duplicatedNote, ...prev]);
      toast.success('Note duplicated successfully');
    }
  }, [notes]);

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  // Error component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center p-8 text-red-600">
      <AlertCircle className="w-5 h-5 mr-2" />
      {message}
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Notes</h1>
            <div className="flex items-center space-x-2">
              <Button onClick={() => handleCreateNote('text')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleCreateNote('text')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Text Note
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('database')}>
                    <Database className="w-4 h-4 mr-2" />
                    Database
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('calendar')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('kanban')}>
                    <Trello className="w-4 h-4 mr-2" />
                    Kanban Board
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('timeline')}>
                    <Activity className="w-4 h-4 mr-2" />
                    Timeline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('mindmap')}>
                    <Brain className="w-4 h-4 mr-2" />
                    Mind Map
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('whiteboard')}>
                    <Palette className="w-4 h-4 mr-2" />
                    Whiteboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('presentation')}>
                    <Presentation className="w-4 h-4 mr-2" />
                    Presentation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('form')}>
                    <FormInput className="w-4 h-4 mr-2" />
                    Form
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNote('workflow')}>
                    <Workflow className="w-4 h-4 mr-2" />
                    Workflow
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <DropdownMenuRadioItem value="updated">Last Updated</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created">Date Created</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="category">Category</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Suspense fallback={<LoadingSpinner />}>
          <NoteSidebar
            notes={filteredNotes}
            activeNote={activeNote}
            onNoteSelect={setActiveNote}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onTogglePin={handleTogglePin}
            onToggleStar={handleToggleStar}
            onToggleArchive={handleToggleArchive}
            onDeleteNote={handleDeleteNote}
            onShareNote={handleShareNote}
            onExportNote={handleExportNote}
            onDuplicateNote={handleDuplicateNote}
          />
        </Suspense>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {activeNote ? (
            <>
              {/* Toolbar */}
              <Suspense fallback={<LoadingSpinner />}>
                <NoteToolbar
                  note={activeNote}
                  onUpdateNote={handleUpdateNote}
                  onTogglePin={handleTogglePin}
                  onToggleStar={handleToggleStar}
                  onToggleArchive={handleToggleArchive}
                  onShareNote={handleShareNote}
                  onExportNote={handleExportNote}
                  onDuplicateNote={handleDuplicateNote}
                  onDeleteNote={handleDeleteNote}
                />
              </Suspense>

              {/* Editor */}
              <div className="flex-1 overflow-auto">
                <Suspense fallback={<LoadingSpinner />}>
                  {activeNote.type === 'text' && (
                    <RichTextEditor
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'database' && (
                    <NoteDatabase
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'calendar' && (
                    <NoteCalendar
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'kanban' && (
                    <NoteKanban
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'timeline' && (
                    <NoteTimeline
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'mindmap' && (
                    <NoteMindmap
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'whiteboard' && (
                    <NoteWhiteboard
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'presentation' && (
                    <NotePresentation
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'form' && (
                    <NoteForms
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                  {activeNote.type === 'workflow' && (
                    <NoteWorkflows
                      note={activeNote}
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                </Suspense>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No note selected</h3>
                <p className="text-sm">Select a note from the sidebar or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default Notes;
