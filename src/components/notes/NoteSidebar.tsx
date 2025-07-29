import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
    Activity,
    Archive,
    Brain,
    Calendar,
    Copy,
    Database,
    Download,
    FileText,
    Globe,
    Grid3X3,
    List,
    MoreHorizontal,
    Palette,
    Pin,
    Search,
    Share2,
    Star,
    Trash2
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface NoteSidebarProps {
  notes: any[];
  activeNote: any;
  onNoteSelect: (note: any) => void;
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
  const [showPinned, setShowPinned] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showShared, setShowShared] = useState(false);

  // Memoized filtered notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        if (!showArchived && note.archived) return false;
        if (showPinned && !note.pinned) return false;
        if (showStarred && !note.starred) return false;
        if (showShared && !note.isPublic) return false;
        
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             note.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
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
  }, [notes, searchQuery, selectedCategory, selectedTags, sortBy, sortOrder, showArchived, showPinned, showStarred, showShared]);

  // Get all unique categories and tags
  const categories = useMemo(() => {
    const cats = [...new Set(notes.map(note => note.category))];
    return cats.map(cat => ({
      name: cat,
      count: notes.filter(note => note.category === cat).length
    }));
  }, [notes]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => note.tags.forEach((tag: string) => tags.add(tag)));
    return Array.from(tags).map(tag => ({
      name: tag,
      count: notes.filter(note => note.tags.includes(tag)).length
    }));
  }, [notes]);

  const getNoteIcon = (note: any) => {
    switch (note.type) {
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'kanban':
        return <Trello className="w-4 h-4" />;
      case 'timeline':
        return <Activity className="w-4 h-4" />;
      case 'mindmap':
        return <Brain className="w-4 h-4" />;
      case 'whiteboard':
        return <Palette className="w-4 h-4" />;
      case 'presentation':
        return <Presentation className="w-4 h-4" />;
      case 'form':
        return <FormInput className="w-4 h-4" />;
      case 'workflow':
        return <Workflow className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderNoteItem = (note: any) => (
    <div
      key={note.id}
      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        activeNote?.id === note.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
      }`}
      onClick={() => onNoteSelect(note)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            {getNoteIcon(note)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-sm truncate">{note.title}</h3>
              {note.pinned && <Pin className="w-3 h-3 text-yellow-500" />}
              {note.starred && <Star className="w-3 h-3 text-yellow-500" />}
              {note.isPublic && <Globe className="w-3 h-3 text-blue-500" />}
            </div>
            <p className="text-xs text-gray-500 truncate mb-2">
              {note.content.substring(0, 100)}...
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {format(note.updatedAt, 'MMM d, yyyy')}
              </span>
              {note.tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{note.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
              <Pin className="w-4 h-4 mr-2" />
              {note.pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStar(note.id)}>
              <Star className="w-4 h-4 mr-2" />
              {note.starred ? 'Unstar' : 'Star'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleArchive(note.id)}>
              <Archive className="w-4 h-4 mr-2" />
              {note.archived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onShareNote(note.id)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportNote(note.id)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicateNote(note.id)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDeleteNote(note.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={viewMode === 'list' ? 'bg-gray-200' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={viewMode === 'grid' ? 'bg-gray-200' : ''}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPinned(!showPinned)}
              className={showPinned ? 'bg-blue-100' : ''}
            >
              <Pin className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStarred(!showStarred)}
              className={showStarred ? 'bg-yellow-100' : ''}
            >
              <Star className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShared(!showShared)}
              className={showShared ? 'bg-green-100' : ''}
            >
              <Globe className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={showArchived ? 'bg-gray-100' : ''}
            >
              <Archive className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-white">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-auto p-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notes found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map(renderNoteItem)}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteSidebar; 