import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    Archive,
    Brain,
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    Database,
    Download,
    FileText,
    Filter,
    FormInput,
    Grid3X3,
    Kanban,
    List,
    Lock,
    Minus,
    Moon,
    MoreHorizontal,
    Palette,
    Pin,
    Presentation,
    Search,
    Settings,
    Share,
    SortAsc,
    SortDesc,
    Star,
    Sun,
    Target,
    Trash2,
    Workflow
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

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
  attachments: any[];
  reminders: Date[];
  version: number;
  lastEditedBy: string;
  parentId?: string;
  children?: string[];
  properties: Record<string, any>;
  permissions: any[];
  aiGenerated: boolean;
  views: any[];
  currentView: string;
  passwordProtected?: boolean;
  password?: string;
}

interface NoteSidebarProps {
  notes: Note[];
  activeNote: Note | null;
  onNoteSelect: (note: Note) => void;
  viewMode: 'list' | 'grid' | 'gallery';
  onViewModeChange: (mode: 'list' | 'grid' | 'gallery') => void;
  onTogglePin: (noteId: string) => void;
  onToggleStar: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onShareNote: (noteId: string) => void;
  onExportNote: (noteId: string) => void;
  onDuplicateNote: (noteId: string) => void;
}

interface Version {
  id: string;
  content: string;
  timestamp: Date;
  version: number;
  author: string;
  changes: string[];
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  lastActive: Date;
  isOnline: boolean;
}

const NoteSidebar: React.FC<NoteSidebarProps> = ({
  notes,
  activeNote,
  onNoteSelect,
  viewMode,
  onViewModeChange,
  onTogglePin,
  onToggleStar,
  onToggleArchive,
  onDeleteNote,
  onShareNote,
  onExportNote,
  onDuplicateNote
}) => {
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
  const [activeTab, setActiveTab] = useState('notes');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'tags' | 'type' | 'date'>('none');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [showShared, setShowShared] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [showPasswordProtected, setShowPasswordProtected] = useState(false);
  const [showAIGenerated, setShowAIGenerated] = useState(false);
  const [showWithAttachments, setShowWithAttachments] = useState(false);
  const [showWithReminders, setShowWithReminders] = useState(false);
  const [showWithCollaborators, setShowWithCollaborators] = useState(false);
  const [showWithComments, setShowWithComments] = useState(false);
  const [showWithVersions, setShowWithVersions] = useState(false);
  const [showWithLinks, setShowWithLinks] = useState(false);
  const [showWithTemplates, setShowWithTemplates] = useState(false);
  const [showWithWorkflows, setShowWithWorkflows] = useState(false);
  const [showWithIntegrations, setShowWithIntegrations] = useState(false);
  const [showWithAnalytics, setShowWithAnalytics] = useState(false);
  const [showWithDatabase, setShowWithDatabase] = useState(false);
  const [showWithCalendar, setShowWithCalendar] = useState(false);
  const [showWithKanban, setShowWithKanban] = useState(false);
  const [showWithTimeline, setShowWithTimeline] = useState(false);
  const [showWithMindmap, setShowWithMindmap] = useState(false);
  const [showWithWhiteboard, setShowWithWhiteboard] = useState(false);
  const [showWithPresentation, setShowWithPresentation] = useState(false);
  const [showWithForms, setShowWithForms] = useState(false);
  const [showWithWorkflows2, setShowWithWorkflows2] = useState(false);
  const [showWithIntegrations2, setShowWithIntegrations2] = useState(false);
  const [showWithAnalytics2, setShowWithAnalytics2] = useState(false);
  const [showWithDatabase2, setShowWithDatabase2] = useState(false);
  const [showWithCalendar2, setShowWithCalendar2] = useState(false);
  const [showWithKanban2, setShowWithKanban2] = useState(false);
  const [showWithTimeline2, setShowWithTimeline2] = useState(false);
  const [showWithMindmap2, setShowWithMindmap2] = useState(false);
  const [showWithWhiteboard2, setShowWithWhiteboard2] = useState(false);
  const [showWithPresentation2, setShowWithPresentation2] = useState(false);
  const [showWithForms2, setShowWithForms2] = useState(false);
  const [showWithWorkflows3, setShowWithWorkflows3] = useState(false);
  const [showWithIntegrations3, setShowWithIntegrations3] = useState(false);
  const [showWithAnalytics3, setShowWithAnalytics3] = useState(false);
  const [showWithDatabase3, setShowWithDatabase3] = useState(false);
  const [showWithCalendar3, setShowWithCalendar3] = useState(false);
  const [showWithKanban3, setShowWithKanban3] = useState(false);
  const [showWithTimeline3, setShowWithTimeline3] = useState(false);
  const [showWithMindmap3, setShowWithMindmap3] = useState(false);
  const [showWithWhiteboard3, setShowWithWhiteboard3] = useState(false);
  const [showWithPresentation3, setShowWithPresentation3] = useState(false);
  const [showWithForms3, setShowWithForms3] = useState(false);
  const [showWithWorkflows4, setShowWithWorkflows4] = useState(false);
  const [showWithIntegrations4, setShowWithIntegrations4] = useState(false);
  const [showWithAnalytics4, setShowWithAnalytics4] = useState(false);
  const [showWithDatabase4, setShowWithDatabase4] = useState(false);
  const [showWithCalendar4, setShowWithCalendar4] = useState(false);
  const [showWithKanban4, setShowWithKanban4] = useState(false);
  const [showWithTimeline4, setShowWithTimeline4] = useState(false);
  const [showWithMindmap4, setShowWithMindmap4] = useState(false);
  const [showWithWhiteboard4, setShowWithWhiteboard4] = useState(false);
  const [showWithPresentation4, setShowWithPresentation4] = useState(false);
  const [showWithForms4, setShowWithForms4] = useState(false);

  // Mock data for demonstration
  const [versionHistory, setVersionHistory] = useState<Version[]>([
    {
      id: 'v1',
      content: 'Initial version',
      timestamp: new Date(Date.now() - 86400000),
      version: 1,
      author: 'John Doe',
      changes: ['Created note']
    },
    {
      id: 'v2',
      content: 'Added content',
      timestamp: new Date(Date.now() - 3600000),
      version: 2,
      author: 'Jane Smith',
      changes: ['Added introduction', 'Updated formatting']
    }
  ]);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
      role: 'owner',
      lastActive: new Date(),
      isOnline: true
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '',
      role: 'editor',
      lastActive: new Date(Date.now() - 300000),
      isOnline: false
    }
  ]);

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        // Basic filters
        if (!showArchived && note.archived) return false;
        if (showFavorites && !note.starred) return false;
        if (showRecent && (Date.now() - note.updatedAt.getTime()) > 86400000) return false;
        if (showShared && !note.isPublic) return false;
        if (showPrivate && note.isPublic) return false;
        if (showPasswordProtected && !note.passwordProtected) return false;
        if (showAIGenerated && !note.aiGenerated) return false;
        if (showWithAttachments && note.attachments.length === 0) return false;
        if (showWithReminders && note.reminders.length === 0) return false;
        if (showWithCollaborators && note.collaborators.length === 0) return false;
        if (showWithComments && !note.properties.comments) return false;
        if (showWithVersions && note.version <= 1) return false;
        if (showWithLinks && !note.properties.links) return false;
        if (showWithTemplates && !note.properties.isTemplate) return false;
        if (showWithWorkflows && note.type !== 'workflow') return false;
        if (showWithIntegrations && !note.properties.integrations) return false;
        if (showWithAnalytics && !note.properties.analytics) return false;
        if (showWithDatabase && note.type !== 'database') return false;
        if (showWithCalendar && note.type !== 'calendar') return false;
        if (showWithKanban && note.type !== 'kanban') return false;
        if (showWithTimeline && note.type !== 'timeline') return false;
        if (showWithMindmap && note.type !== 'mindmap') return false;
        if (showWithWhiteboard && note.type !== 'whiteboard') return false;
        if (showWithPresentation && note.type !== 'presentation') return false;
        if (showWithForms && note.type !== 'form') return false;

        // Search filter
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        // Category filter
        const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;

        // Tags filter
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => note.tags.includes(tag));

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
  }, [
    notes, searchQuery, selectedCategory, selectedTags, sortBy, sortOrder, showArchived,
    showFavorites, showRecent, showShared, showPrivate, showPasswordProtected, showAIGenerated,
    showWithAttachments, showWithReminders, showWithCollaborators, showWithComments,
    showWithVersions, showWithLinks, showWithTemplates, showWithWorkflows, showWithIntegrations,
    showWithAnalytics, showWithDatabase, showWithCalendar, showWithKanban, showWithTimeline,
    showWithMindmap, showWithWhiteboard, showWithPresentation, showWithForms
  ]);

  // Grouped notes
  const groupedNotes = useMemo(() => {
    if (groupBy === 'none') return { 'All Notes': filteredNotes };

    const groups: Record<string, Note[]> = {};

    filteredNotes.forEach(note => {
      let groupKey = '';

      switch (groupBy) {
        case 'category':
          groupKey = note.category;
          break;
        case 'tags':
          groupKey = note.tags.length > 0 ? note.tags[0] : 'Untagged';
          break;
        case 'type':
          groupKey = note.type.charAt(0).toUpperCase() + note.type.slice(1);
          break;
        case 'date':
          const today = new Date();
          const noteDate = new Date(note.updatedAt);
          const diffTime = Math.abs(today.getTime() - noteDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) groupKey = 'Today';
          else if (diffDays <= 7) groupKey = 'This Week';
          else if (diffDays <= 30) groupKey = 'This Month';
          else groupKey = 'Older';
          break;
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(note);
    });

    return groups;
  }, [filteredNotes, groupBy]);

  // Get all unique categories and tags
  const categories = useMemo(() => {
    const cats = [...new Set(notes.map(note => note.category))];
    return cats.sort();
  }, [notes]);

  const allTags = useMemo(() => {
    const tags = notes.flatMap(note => note.tags);
    return [...new Set(tags)].sort();
  }, [notes]);

  // Note type icons
  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'kanban': return <Kanban className="h-4 w-4" />;
      case 'timeline': return <Activity className="h-4 w-4" />;
      case 'mindmap': return <Brain className="h-4 w-4" />;
      case 'whiteboard': return <Palette className="h-4 w-4" />;
      case 'presentation': return <Presentation className="h-4 w-4" />;
      case 'form': return <FormInput className="h-4 w-4" />;
      case 'workflow': return <Workflow className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Handle note actions
  const handleNoteAction = useCallback((action: string, noteId: string) => {
    switch (action) {
      case 'pin':
        onTogglePin(noteId);
        break;
      case 'star':
        onToggleStar(noteId);
        break;
      case 'archive':
        onToggleArchive(noteId);
        break;
      case 'share':
        onShareNote(noteId);
        break;
      case 'export':
        onExportNote(noteId);
        break;
      case 'duplicate':
        onDuplicateNote(noteId);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this note?')) {
          onDeleteNote(noteId);
        }
        break;
    }
  }, [onTogglePin, onToggleStar, onToggleArchive, onShareNote, onExportNote, onDuplicateNote, onDeleteNote]);

  return (
    <div className="w-80 border-r bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCompactMode(!compactMode)}>
                  <Minus className="h-4 w-4 mr-2" />
                  {compactMode ? 'Normal View' : 'Compact View'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-1 mb-4">
          <Badge
            variant={showFavorites ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star className="h-3 w-3 mr-1" />
            Favorites
          </Badge>
          <Badge
            variant={showRecent ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setShowRecent(!showRecent)}
          >
            <Clock className="h-3 w-3 mr-1" />
            Recent
          </Badge>
          <Badge
            variant={showShared ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setShowShared(!showShared)}
          >
            <Share className="h-3 w-3 mr-1" />
            Shared
          </Badge>
          <Badge
            variant={showArchived ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-3 w-3 mr-1" />
            Archived
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Group Controls */}
              <div className="flex items-center justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Group by: {groupBy === 'none' ? 'None' : groupBy}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setGroupBy('none')}>None</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy('category')}>Category</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy('tags')}>Tags</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy('type')}>Type</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy('date')}>Date</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy('updated')}>Last Updated</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('created')}>Date Created</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('title')}>Title</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('category')}>Category</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Notes List */}
              {Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
                <div key={groupName}>
                  {groupBy !== 'none' && (
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{groupName}</h3>
                  )}
                  
                  <div className="space-y-2">
                    {groupNotes.map((note) => (
                      <Card
                        key={note.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          activeNote?.id === note.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : ''
                        } ${note.pinned ? 'border-l-4 border-l-yellow-500' : ''}`}
                        onClick={() => onNoteSelect(note)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                {getNoteTypeIcon(note.type)}
                                <h4 className="font-medium text-sm truncate">{note.title}</h4>
                                {note.pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                                {note.starred && <Star className="h-3 w-3 text-yellow-500" />}
                                {note.passwordProtected && <Lock className="h-3 w-3 text-red-500" />}
                                {note.aiGenerated && <Brain className="h-3 w-3 text-green-500" />}
                              </div>
                              
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                {note.content.substring(0, 100)}...
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-400">
                                    {formatDate(note.updatedAt)}
                                  </span>
                                  {note.wordCount > 0 && (
                                    <span className="text-xs text-gray-400">
                                      {note.wordCount} words
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  {note.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{note.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleNoteAction('pin', note.id)}>
                                  <Pin className="h-4 w-4 mr-2" />
                                  {note.pinned ? 'Unpin' : 'Pin'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleNoteAction('star', note.id)}>
                                  <Star className="h-4 w-4 mr-2" />
                                  {note.starred ? 'Unstar' : 'Star'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleNoteAction('share', note.id)}>
                                  <Share className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleNoteAction('export', note.id)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleNoteAction('duplicate', note.id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleNoteAction('archive', note.id)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  {note.archived ? 'Unarchive' : 'Archive'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleNoteAction('delete', note.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredNotes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notes found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="font-medium mb-4">Note Templates</h3>
              <div className="space-y-2">
                <Card className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Meeting Notes</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">Project Plan</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Task List</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="collaboration" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="font-medium mb-4">Collaboration</h3>
              
              {/* Collaborators */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Active Collaborators</h4>
                <div className="space-y-2">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{collaborator.name}</p>
                        <p className="text-xs text-gray-500">{collaborator.role}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${collaborator.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Version History */}
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Changes</h4>
                <div className="space-y-2">
                  {versionHistory.map((version) => (
                    <div key={version.id} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{version.version}</span>
                        <span className="text-gray-500">{formatDate(version.timestamp)}</span>
                      </div>
                      <p className="text-gray-600">{version.author}</p>
                      <ul className="text-xs text-gray-500 mt-1">
                        {version.changes.map((change, index) => (
                          <li key={index}>• {change}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="font-medium mb-4">Analytics</h3>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2">Note Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Notes</p>
                        <p className="font-medium">{notes.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Words Written</p>
                        <p className="font-medium">{notes.reduce((sum, note) => sum + note.wordCount, 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Collaborators</p>
                        <p className="font-medium">{collaborators.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Active Projects</p>
                        <p className="font-medium">{notes.filter(note => !note.archived).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2">Most Used Tags</h4>
                    <div className="space-y-2">
                      {allTags.slice(0, 5).map((tag) => (
                        <div key={tag} className="flex items-center justify-between">
                          <Badge variant="outline">{tag}</Badge>
                          <span className="text-sm text-gray-500">
                            {notes.filter(note => note.tags.includes(tag)).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NoteSidebar; 