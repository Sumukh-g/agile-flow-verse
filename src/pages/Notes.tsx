
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  StickyNote,
  FolderPlus,
  FileEdit,
  Trash2,
  Star,
  CalendarClock,
  Tag,
  Save,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  parent?: string;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  tags: string[];
}

interface Folder {
  id: string;
  name: string;
  parent?: string;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<{id?: string, name: string}[]>([{ name: 'Notes' }]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    tags: []
  });
  const [newFolder, setNewFolder] = useState<Partial<Folder>>({
    name: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    setTimeout(() => {
      const mockFolders: Folder[] = [
        { id: 'f1', name: 'Personal' },
        { id: 'f2', name: 'Work' },
        { id: 'f3', name: 'Project Ideas', parent: 'f2' },
        { id: 'f4', name: 'Travel', parent: 'f1' }
      ];
      
      const mockNotes: Note[] = [
        {
          id: 'n1',
          title: 'Getting Started',
          content: 'Welcome to your notes app! Here are some tips to get started...',
          createdAt: '2023-05-10T10:00:00Z',
          updatedAt: '2023-05-10T10:00:00Z',
          starred: true,
          tags: ['info', 'tutorial']
        },
        {
          id: 'n2',
          title: 'Project Requirements',
          content: '1. User authentication\n2. Dashboard with analytics\n3. Project management features',
          parent: 'f2',
          createdAt: '2023-05-12T14:30:00Z',
          updatedAt: '2023-05-14T09:15:00Z',
          starred: true,
          tags: ['work', 'planning']
        },
        {
          id: 'n3',
          title: 'Weekend Plans',
          content: 'Things to do this weekend:\n- Hiking at the national park\n- Dinner with friends\n- Start reading new book',
          parent: 'f1',
          createdAt: '2023-05-15T18:20:00Z',
          updatedAt: '2023-05-15T18:20:00Z',
          starred: false,
          tags: ['personal', 'plans']
        },
        {
          id: 'n4',
          title: 'App Ideas',
          content: 'Potential app ideas to explore:\n1. Fitness tracker with social features\n2. Recipe manager with meal planning\n3. Productivity tool with Pomodoro timer',
          parent: 'f3',
          createdAt: '2023-05-17T11:45:00Z',
          updatedAt: '2023-05-18T10:30:00Z',
          starred: false,
          tags: ['ideas', 'development']
        },
        {
          id: 'n5',
          title: 'Japan Trip Plans',
          content: 'Places to visit:\n- Tokyo\n- Kyoto\n- Osaka\n- Hiroshima',
          parent: 'f4',
          createdAt: '2023-05-19T09:00:00Z',
          updatedAt: '2023-05-19T09:00:00Z',
          starred: false,
          tags: ['travel', 'planning']
        },
        {
          id: 'n6',
          title: 'Meeting Notes',
          content: 'Discussion points:\n- Q2 goals review\n- New feature priorities\n- Team structure changes',
          parent: 'f2',
          createdAt: '2023-05-20T15:00:00Z',
          updatedAt: '2023-05-20T16:30:00Z',
          starred: false,
          tags: ['work', 'meetings']
        }
      ];
      
      setFolders(mockFolders);
      setNotes(mockNotes);
      setLoading(false);
    }, 800);
  }, []);
  
  // Update breadcrumbs when folder changes
  useEffect(() => {
    if (currentFolder === undefined) {
      setBreadcrumbs([{ name: 'Notes' }]);
      return;
    }
    
    const breadcrumbPath = [];
    let currentItem = currentFolder;
    
    breadcrumbPath.unshift({
      id: currentItem,
      name: folders.find(f => f.id === currentItem)?.name || 'Unknown Folder'
    });
    
    let parentFolder = folders.find(f => f.id === currentItem)?.parent;
    while (parentFolder) {
      breadcrumbPath.unshift({
        id: parentFolder,
        name: folders.find(f => f.id === parentFolder)?.name || 'Unknown Folder'
      });
      parentFolder = folders.find(f => f.id === parentFolder)?.parent;
    }
    
    setBreadcrumbs([{ name: 'Notes' }, ...breadcrumbPath]);
  }, [currentFolder, folders]);
  
  // Filter notes based on current folder, search and filters
  const filteredNotes = notes.filter(note => {
    // Filter by folder
    const matchesFolder = currentFolder === undefined ? 
      !note.parent : note.parent === currentFolder;
    
    // Filter by search
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply active filter
    let matchesFilter = true;
    if (activeFilter === 'starred') {
      matchesFilter = note.starred;
    } else if (activeFilter === 'recent') {
      // Just a mock for recent notes, in a real app would check date
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesFilter = new Date(note.updatedAt) > weekAgo;
    }
    
    return matchesFolder && matchesSearch && matchesFilter;
  });
  
  // Filter folders based on current folder
  const filteredFolders = folders.filter(folder => folder.parent === currentFolder);
  
  const handleCreateNote = () => {
    if (!newNote.title) {
      toast.error('Please enter a title for your note');
      return;
    }
    
    const createdNote: Note = {
      id: `n${Date.now()}`,
      title: newNote.title!,
      content: newNote.content || '',
      parent: currentFolder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      tags: Array.isArray(newNote.tags) ? newNote.tags : []
    };
    
    setNotes([createdNote, ...notes]);
    setNewNote({ title: '', content: '', tags: [] });
    setNoteDialogOpen(false);
    toast.success('Note created successfully');
  };
  
  const handleCreateFolder = () => {
    if (!newFolder.name) {
      toast.error('Please enter a name for your folder');
      return;
    }
    
    const createdFolder: Folder = {
      id: `f${Date.now()}`,
      name: newFolder.name!,
      parent: currentFolder
    };
    
    setFolders([...folders, createdFolder]);
    setNewFolder({ name: '' });
    setFolderDialogOpen(false);
    toast.success('Folder created successfully');
  };
  
  const handleOpenNote = (note: Note) => {
    setActiveNote(note);
    setIsEditing(false);
  };
  
  const handleSaveNote = () => {
    if (!activeNote) return;
    
    setNotes(prev => prev.map(note => 
      note.id === activeNote.id ? 
        { ...activeNote, updatedAt: new Date().toISOString() } : 
        note
    ));
    
    setIsEditing(false);
    toast.success('Note saved successfully');
  };
  
  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
    
    toast.success('Note deleted successfully');
  };
  
  const handleToggleStar = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? 
        { ...note, starred: !note.starred } : 
        note
    ));
    
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, starred: !prev.starred } : null);
    }
  };
  
  const handleNavigateToFolder = (folderId?: string) => {
    setCurrentFolder(folderId);
    setActiveNote(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">
            Organize and manage your notes and documents
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input 
                    id="folder-name"
                    value={newFolder.name}
                    onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                    placeholder="Enter folder name"
                  />
                </div>
                {currentFolder && (
                  <div className="text-sm text-muted-foreground">
                    Creating in: {breadcrumbs.map(b => b.name).join(' / ')}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCreateFolder}>
                  Create Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Title</Label>
                  <Input 
                    id="note-title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Enter note title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-content">Content</Label>
                  <Textarea 
                    id="note-content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Enter note content"
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-tags">Tags (comma separated)</Label>
                  <Input 
                    id="note-tags"
                    placeholder="work, important, idea"
                    onChange={(e) => setNewNote({ 
                      ...newNote, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                  />
                </div>
                {currentFolder && (
                  <div className="text-sm text-muted-foreground">
                    Creating in: {breadcrumbs.map(b => b.name).join(' / ')}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNoteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCreateNote}>
                  Create Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Breadcrumb navigation */}
      <div className="flex items-center space-x-1 text-sm">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
            <Button 
              variant="ghost"
              className="h-auto p-1"
              onClick={() => handleNavigateToFolder(item.id)}
            >
              {item.name}
            </Button>
          </React.Fragment>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar with filters and folders */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="py-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Button 
                  variant={activeFilter === 'all' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('all')}
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  All Notes
                </Button>
                <Button 
                  variant={activeFilter === 'starred' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('starred')}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </Button>
                <Button 
                  variant={activeFilter === 'recent' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('recent')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Recent
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1">
                  <h3 className="text-sm font-medium">Folders</h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFolderDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {filteredFolders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {currentFolder ? 'No subfolders' : 'No folders created yet'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredFolders.map((folder) => (
                      <Button 
                        key={folder.id} 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => handleNavigateToFolder(folder.id)}
                      >
                        <FolderPlus className="h-4 w-4 mr-2 text-amber-600" />
                        {folder.name}
                      </Button>
                    ))}
                  </div>
                )}
                
                {currentFolder && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => handleNavigateToFolder(folders.find(f => f.id === currentFolder)?.parent)}
                  >
                    <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                    Back
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle column with notes list */}
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-180px)] flex flex-col">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">
                Notes {filteredNotes.length > 0 && `(${filteredNotes.length})`}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setNoteDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading notes...</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">No notes found</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    {searchQuery ? 'Try a different search term' : 'Create your first note to get started'}
                  </p>
                  <Button onClick={() => setNoteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-3 rounded-md cursor-pointer hover:bg-muted transition-all ${
                        activeNote?.id === note.id ? 'bg-muted border-l-4 border-primary' : ''
                      }`}
                      onClick={() => handleOpenNote(note)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium line-clamp-1">
                            {note.title}
                          </h3>
                          <p className="line-clamp-2 text-sm text-muted-foreground mt-1">
                            {note.content || 'No content'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex flex-wrap gap-1">
                              {note.tags.slice(0, 2).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="px-1 text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {note.tags.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{note.tags.length - 2}
                                </span>
                              )}
                            </div>
                            <div className="flex-1" />
                            <p className="text-xs text-muted-foreground">
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 text-${note.starred ? 'amber-500' : 'muted-foreground'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(note.id);
                          }}
                        >
                          <Star className="h-4 w-4" fill={note.starred ? 'currentColor' : 'none'} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column with note detail */}
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-180px)] flex flex-col">
            {!activeNote ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No note selected</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Select a note to view or edit its content
                </p>
              </div>
            ) : (
              <>
                <CardHeader className="py-4 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    {isEditing ? (
                      <Input
                        value={activeNote.title}
                        onChange={(e) => setActiveNote({...activeNote, title: e.target.value})}
                        className="font-medium"
                      />
                    ) : (
                      <CardTitle className="text-base font-medium">{activeNote.title}</CardTitle>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {new Date(activeNote.updatedAt).toLocaleDateString()}
                      </div>
                      {activeNote.tags.length > 0 && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Tag className="h-3 w-3 mr-1" />
                          {activeNote.tags.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <Button variant="ghost" size="icon" onClick={handleSaveNote}>
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                        <FileEdit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleToggleStar(activeNote.id)}
                          className={activeNote.starred ? 'text-amber-500' : ''}
                        >
                          <Star className="h-4 w-4 mr-2" fill={activeNote.starred ? 'currentColor' : 'none'} />
                          {activeNote.starred ? 'Unstar' : 'Star'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <FileEdit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Move note feature coming soon")}>
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteNote(activeNote.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <Separator />
                
                <CardContent className="flex-1 overflow-auto py-4">
                  {isEditing ? (
                    <Textarea
                      value={activeNote.content}
                      onChange={(e) => setActiveNote({...activeNote, content: e.target.value})}
                      className="min-h-[calc(100vh-320px)]"
                    />
                  ) : (
                    <div className="whitespace-pre-line">
                      {activeNote.content || 'No content'}
                    </div>
                  )}
                </CardContent>
                
                {isEditing && (
                  <>
                    <Separator />
                    <div className="p-4 flex justify-end">
                      <Button onClick={handleSaveNote}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Notes;
