import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
    Archive,
    Bold,
    Code,
    Copy,
    Download,
    FileText,
    Filter,
    Hash,
    Heading2,
    Image as ImageIcon,
    Italic,
    Link,
    List, ListOrdered,
    MoreHorizontal,
    Paperclip,
    Pin,
    Plus,
    Quote,
    Save,
    Search,
    Share, Star,
    Table,
    Trash2,
    Underline,
    Users
} from "lucide-react";
import { useEffect, useState } from 'react';
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
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
  attachments: string[];
  reminders: Date[];
  version: number;
  lastEditedBy: string;
}

interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
  category: string;
  icon: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', color: 'bg-blue-100 text-blue-800', icon: '👤', count: 3 },
  { id: 'work', name: 'Work', color: 'bg-green-100 text-green-800', icon: '💼', count: 5 },
  { id: 'ideas', name: 'Ideas', color: 'bg-yellow-100 text-yellow-800', icon: '💡', count: 2 },
  { id: 'projects', name: 'Projects', color: 'bg-purple-100 text-purple-800', icon: '🚀', count: 4 },
  { id: 'meetings', name: 'Meetings', color: 'bg-red-100 text-red-800', icon: '📅', count: 6 },
];

const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'Project Ideas',
    content: 'Here are some project ideas for the next quarter:\n- Mobile app redesign\n- API integration with third-party services\n- Performance optimization',
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-05-10'),
    tags: ['Ideas', 'Planning'],
    pinned: true,
    starred: true
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Discussion points from today\'s meeting:\n1. Budget review\n2. Timeline adjustments\n3. Resource allocation',
    createdAt: new Date('2023-05-05'),
    updatedAt: new Date('2023-05-05'),
    tags: ['Meetings', 'Important'],
    pinned: false,
    starred: false
  }
];

const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'template1',
    name: 'Meeting Notes',
    description: 'Template for capturing meeting discussions',
    content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n1. \n2. \n3. \n\n## Discussion\n\n## Action Items\n- [ ] \n- [ ] \n- [ ] \n\n## Next Steps\n\n',
    tags: ['Meetings']
  },
  {
    id: 'template2',
    name: 'Project Brief',
    description: 'Template for new project specifications',
    content: '# Project Brief\n\n**Project Name:** \n**Start Date:** \n**End Date:** \n\n## Objectives\n\n## Scope\n\n## Deliverables\n\n## Stakeholders\n\n## Budget\n\n## Timeline\n\n',
    tags: ['Project', 'Planning']
  },
  {
    id: 'template3',
    name: 'Weekly Report',
    description: 'Template for weekly status updates',
    content: '# Weekly Report\n\n**Week of:** \n\n## Accomplishments\n\n## In Progress\n\n## Blockers\n\n## Next Week Plans\n\n',
    tags: ['Reports', 'Weekly']
  }
];

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [editorState, setEditorState] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false
  });

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        const processedNotes = parsedNotes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          reminders: note.reminders?.map((r: string) => new Date(r)) || []
        }));
        setNotes(processedNotes);
      } catch (error) {
        console.error('Error parsing notes from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
    updateCategoryCounts();
  }, [notes]);

  const updateCategoryCounts = () => {
    const counts = notes.reduce((acc, note) => {
      if (!note.archived || showArchived) {
        acc[note.category] = (acc[note.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    setCategories(prev => prev.map(cat => ({
      ...cat,
      count: counts[cat.id] || 0
    })));
  };

  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const calculateWordCount = (content: string): number => {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const filteredNotes = notes
    .filter(note => {
      if (!showArchived && note.archived) return false;
      
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => note.tags.includes(tag));
      
      let matchesTab = true;
      if (activeTab === 'pinned') matchesTab = note.pinned;
      else if (activeTab === 'starred') matchesTab = note.starred;
      else if (activeTab === 'shared') matchesTab = note.isPublic;
      else if (activeTab === 'archived') matchesTab = note.archived;
      
      return matchesSearch && matchesCategory && matchesTags && matchesTab;
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

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setIsEditing(false);
  };

  const handleEditNote = () => {
    if (!activeNote) return;
    setNewNoteTitle(activeNote.title);
    setNewNoteContent(activeNote.content);
    setNewNoteCategory(activeNote.category);
    setNewNoteColor(activeNote.color);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeNote) return;
    
    const wordCount = calculateWordCount(newNoteContent);
    const readingTime = calculateReadingTime(newNoteContent);
    
    const updatedNotes = notes.map(note => 
      note.id === activeNote.id 
        ? { 
            ...note, 
            title: newNoteTitle, 
            content: newNoteContent,
            category: newNoteCategory,
            color: newNoteColor,
            updatedAt: new Date(),
            wordCount,
            readingTime,
            version: note.version + 1,
            lastEditedBy: 'current.user'
          }
        : note
    );
    
    setNotes(updatedNotes);
    setActiveNote({
      ...activeNote,
      title: newNoteTitle,
      content: newNoteContent,
      category: newNoteCategory,
      color: newNoteColor,
      updatedAt: new Date(),
      wordCount,
      readingTime,
      version: activeNote.version + 1,
      lastEditedBy: 'current.user'
    });
    setIsEditing(false);
    toast.success('Note updated successfully');
  };

  const handleCreateNote = () => {
    const wordCount = calculateWordCount(newNoteContent);
    const readingTime = calculateReadingTime(newNoteContent);
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle || 'Untitled Note',
      content: newNoteContent || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      pinned: false,
      starred: false,
      archived: false,
      category: newNoteCategory,
      color: newNoteColor,
      collaborators: [],
      isPublic: false,
      wordCount,
      readingTime,
      attachments: [],
      reminders: [],
      version: 1,
      lastEditedBy: 'current.user'
    };
    
    setNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteCategory('personal');
    setNewNoteColor('bg-white');
    setIsCreateDialogOpen(false);
    toast.success('Note created successfully');
  };

  const handleCreateFromTemplate = (template: NoteTemplate) => {
    const wordCount = calculateWordCount(template.content);
    const readingTime = calculateReadingTime(template.content);
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: template.name,
      content: template.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [...template.tags],
      pinned: false,
      starred: false,
      archived: false,
      category: template.category,
      color: 'bg-white',
      collaborators: [],
      isPublic: false,
      wordCount,
      readingTime,
      attachments: [],
      reminders: [],
      version: 1,
      lastEditedBy: 'current.user'
    };
    
    setNotes([newNote, ...notes]);
    setShowTemplates(false);
    toast.success(`Note created from ${template.name} template`);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
    toast.success('Note deleted');
  };

  const handleTogglePin = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, pinned: !note.pinned } : note
    ));
    
    const note = notes.find(n => n.id === noteId);
    const action = note?.pinned ? 'unpinned' : 'pinned';
    toast.success(`Note ${action}`);
  };

  const handleToggleStar = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, starred: !note.starred } : note
    ));
    
    const note = notes.find(n => n.id === noteId);
    const action = note?.starred ? 'removed from favorites' : 'added to favorites';
    toast.success(`Note ${action}`);
  };

  const handleToggleArchive = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, archived: !note.archived } : note
    ));
    
    const note = notes.find(n => n.id === noteId);
    const action = note?.archived ? 'unarchived' : 'archived';
    toast.success(`Note ${action}`);
  };

  const handleAddTag = (noteId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: [...new Set([...note.tags, tag.trim()])] }
        : note
    ));
    toast.success('Tag added');
  };

  const handleRemoveTag = (noteId: string, tagToRemove: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: note.tags.filter(tag => tag !== tagToRemove) }
        : note
    ));
    toast.success('Tag removed');
  };

  const handleDuplicateNote = (noteId: string) => {
    const originalNote = notes.find(n => n.id === noteId);
    if (!originalNote) return;
    
    const duplicatedNote: Note = {
      ...originalNote,
      id: Date.now().toString(),
      title: `${originalNote.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      lastEditedBy: 'current.user'
    };
    
    setNotes([duplicatedNote, ...notes]);
    toast.success('Note duplicated');
  };

  const handleExportNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const exportData = {
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.category,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Note exported');
  };

  const handleShareNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, isPublic: !n.isPublic } : n
    ));
    
    const action = note.isPublic ? 'made private' : 'shared publicly';
    toast.success(`Note ${action}`);
  };

  const formatText = (format: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'heading':
        formattedText = `## ${selectedText}`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'orderedList':
        formattedText = `1. ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      default:
        return;
    }
    
    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setNewNoteContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const insertTable = () => {
    const tableMarkdown = '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Data     | Data     |\n| Row 2    | Data     | Data     |\n\n';
    setNewNoteContent(prev => prev + tableMarkdown);
  };

  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags);
    return [...new Set(allTags)].sort();
  };

  const getColorOptions = () => [
    { value: 'bg-white', label: 'White', color: 'bg-white' },
    { value: 'bg-red-50', label: 'Red', color: 'bg-red-50' },
    { value: 'bg-orange-50', label: 'Orange', color: 'bg-orange-50' },
    { value: 'bg-yellow-50', label: 'Yellow', color: 'bg-yellow-50' },
    { value: 'bg-green-50', label: 'Green', color: 'bg-green-50' },
    { value: 'bg-blue-50', label: 'Blue', color: 'bg-blue-50' },
    { value: 'bg-indigo-50', label: 'Indigo', color: 'bg-indigo-50' },
    { value: 'bg-purple-50', label: 'Purple', color: 'bg-purple-50' },
    { value: 'bg-pink-50', label: 'Pink', color: 'bg-pink-50' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Notes</h1>
            <div className="flex gap-2">
              <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Note Templates</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {NOTE_TEMPLATES.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{template.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1 mb-3">
                            {template.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <Button 
                            onClick={() => handleCreateFromTemplate(template)}
                            className="w-full"
                            size="sm"
                          >
                            Use Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Enter note title" 
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newNoteCategory} onValueChange={setNewNoteCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Select value={newNoteColor} onValueChange={setNewNoteColor}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getColorOptions().map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border ${color.color}`} />
                                  <span>{color.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea 
                        id="content" 
                        placeholder="Start writing your note..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateNote}>Create Note</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="pinned" className="text-xs">Pinned</TabsTrigger>
              <TabsTrigger value="starred" className="text-xs">Starred</TabsTrigger>
              <TabsTrigger value="shared" className="text-xs">Shared</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categories</Label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                  selectedCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                }`}
              >
                All Categories ({notes.filter(n => !n.archived || showArchived).length})
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center justify-between ${
                    selectedCategory === category.id ? category.color : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                  <span className="text-xs opacity-70">({category.count})</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Rows3 className="h-4 w-4" />
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <DropdownMenuRadioItem value="updated">Last Updated</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created">Date Created</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="category">Category</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                  <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                >
                  Show Archived
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No notes found</p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Create your first note to get started'}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card 
                key={note.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeNote?.id === note.id ? 'ring-2 ring-blue-500' : ''
                } ${note.color}`}
                onClick={() => handleSelectNote(note)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.pinned && <Pin className="h-3 w-3 text-orange-500" />}
                        {note.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        {note.isPublic && <Users className="h-3 w-3 text-green-500" />}
                        {note.archived && <Archive className="h-3 w-3 text-gray-500" />}
                      </div>
                      <CardTitle className="text-sm font-medium truncate">{note.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {format(note.updatedAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditNote(); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateNote(note.id); }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePin(note.id); }}>
                          <Pin className="h-4 w-4 mr-2" />
                          {note.pinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStar(note.id); }}>
                          <Star className="h-4 w-4 mr-2" />
                          {note.starred ? 'Remove from favorites' : 'Add to favorites'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShareNote(note.id); }}>
                          <Share className="h-4 w-4 mr-2" />
                          {note.isPublic ? 'Make Private' : 'Share'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExportNote(note.id); }}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleArchive(note.id); }}>
                          <Archive className="h-4 w-4 mr-2" />
                          {note.archived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {note.content.substring(0, 100)}...
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{note.tags.length - 3}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{note.wordCount} words</span>
                    <span>{note.readingTime} min read</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            {/* Note Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{activeNote.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Created {format(activeNote.createdAt, 'MMM d, yyyy')}</span>
                    <span>Updated {format(activeNote.updatedAt, 'MMM d, yyyy')}</span>
                    <span>{activeNote.wordCount} words</span>
                    <span>{activeNote.readingTime} min read</span>
                    <span>v{activeNote.version}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleEditNote}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDuplicateNote(activeNote.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportNote(activeNote.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareNote(activeNote.id)}>
                        <Share className="h-4 w-4 mr-2" />
                        {activeNote.isPublic ? 'Make Private' : 'Share'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleArchive(activeNote.id)}>
                        <Archive className="h-4 w-4 mr-2" />
                        {activeNote.archived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteNote(activeNote.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {activeNote.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="h-full flex flex-col">
                  {/* Editor Toolbar */}
                  <div className="bg-white border-b border-gray-200 p-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => formatText('bold')}>
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => formatText('italic')}>
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => formatText('underline')}>
                        <Underline className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm" onClick={() => formatText('heading')}>
                        <Heading2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => formatText('quote')}>
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => formatText('code')}>
                        <Code className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm" onClick={() => formatText('list')}>
                        <List className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => formatText('orderedList')}>
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={insertTable}>
                        <Table className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Editor */}
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      <Input
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="text-2xl font-bold border-none shadow-none p-0 focus-visible:ring-0"
                        placeholder="Note title..."
                      />
                      <Textarea
                        ref={editorRef}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="min-h-[500px] border-none shadow-none resize-none focus-visible:ring-0"
                        placeholder="Start writing..."
                      />
                    </div>
                  </div>
                  
                  {/* Editor Footer */}
                  <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{calculateWordCount(newNoteContent)} words</span>
                        <span>{calculateReadingTime(newNoteContent)} min read</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 max-w-4xl mx-auto">
                  <div className="prose prose-lg max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">{activeNote.content}</pre>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FileText className="h-24 w-24 mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">Select a note to view</h2>
              <p className="text-gray-500 mb-6">Choose a note from the sidebar or create a new one</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
