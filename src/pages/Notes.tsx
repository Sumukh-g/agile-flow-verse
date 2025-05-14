
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Heading2, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon,
  Share, Star, Clock, Tag, Trash2, Plus, Search, MoreHorizontal,
  FileText, Settings
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  pinned: boolean;
  starred: boolean;
}

interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
}

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
    // Load notes from localStorage if available
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        // Convert string dates back to Date objects
        const processedNotes = parsedNotes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        setNotes(processedNotes);
      } catch (error) {
        console.error('Error parsing notes from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save notes to localStorage whenever they change
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pinned') return matchesSearch && note.pinned;
    if (activeTab === 'starred') return matchesSearch && note.starred;
    
    return matchesSearch;
  });

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setIsEditing(false);
  };

  const handleEditNote = () => {
    if (!activeNote) return;
    setNewNoteTitle(activeNote.title);
    setNewNoteContent(activeNote.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeNote) return;
    
    const updatedNotes = notes.map(note => 
      note.id === activeNote.id 
        ? { 
            ...note, 
            title: newNoteTitle, 
            content: newNoteContent,
            updatedAt: new Date()
          }
        : note
    );
    
    setNotes(updatedNotes);
    setActiveNote({
      ...activeNote,
      title: newNoteTitle,
      content: newNoteContent,
      updatedAt: new Date()
    });
    setIsEditing(false);
    toast.success('Note updated successfully');
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle || 'Untitled Note',
      content: newNoteContent || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      pinned: false,
      starred: false
    };
    
    setNotes([...notes, newNote]);
    setNewNoteTitle('');
    setNewNoteContent('');
    toast.success('Note created successfully');
  };

  const handleCreateFromTemplate = (template: NoteTemplate) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `${template.name} - ${format(new Date(), 'MMM d, yyyy')}`,
      content: template.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: template.tags,
      pinned: false,
      starred: false
    };
    
    setNotes([...notes, newNote]);
    setActiveNote(newNote);
    setIsEditing(false);
    setShowTemplates(false);
    toast.success(`Created note from "${template.name}" template`);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
    if (activeNote?.id === noteId) {
      setActiveNote(null);
      setIsEditing(false);
    }
    toast.success('Note deleted successfully');
  };

  const handleTogglePin = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, pinned: !note.pinned }
        : note
    );
    setNotes(updatedNotes);
    
    if (activeNote?.id === noteId) {
      setActiveNote({ ...activeNote, pinned: !activeNote.pinned });
    }
  };

  const handleToggleStar = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, starred: !note.starred }
        : note
    );
    setNotes(updatedNotes);
    
    if (activeNote?.id === noteId) {
      setActiveNote({ ...activeNote, starred: !activeNote.starred });
    }
  };

  const handleAddTag = () => {
    if (!activeNote || !newNoteTag.trim()) return;
    
    if (activeNote.tags.includes(newNoteTag.trim())) {
      toast.error('Tag already exists');
      return;
    }
    
    const updatedTags = [...activeNote.tags, newNoteTag.trim()];
    const updatedNotes = notes.map(note => 
      note.id === activeNote.id 
        ? { ...note, tags: updatedTags }
        : note
    );
    
    setNotes(updatedNotes);
    setActiveNote({ ...activeNote, tags: updatedTags });
    setNewNoteTag('');
    toast.success('Tag added successfully');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    
    const updatedTags = activeNote.tags.filter(tag => tag !== tagToRemove);
    const updatedNotes = notes.map(note => 
      note.id === activeNote.id 
        ? { ...note, tags: updatedTags }
        : note
    );
    
    setNotes(updatedNotes);
    setActiveNote({ ...activeNote, tags: updatedTags });
    toast.success('Tag removed');
  };

  const formatText = (format: string) => {
    // Mock rich text formatting actions
    switch (format) {
      case 'bold':
        setEditorState({ ...editorState, isBold: !editorState.isBold });
        toast.info('Bold formatting applied');
        break;
      case 'italic':
        setEditorState({ ...editorState, isItalic: !editorState.isItalic });
        toast.info('Italic formatting applied');
        break;
      case 'underline':
        setEditorState({ ...editorState, isUnderline: !editorState.isUnderline });
        toast.info('Underline formatting applied');
        break;
      default:
        toast.info(`${format} formatting applied`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Notes</h1>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Note Templates</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {NOTE_TEMPLATES.map(template => (
                  <Card key={template.id} className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleCreateFromTemplate(template)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input 
                    id="title" 
                    value={newNoteTitle} 
                    onChange={(e) => setNewNoteTitle(e.target.value)} 
                    placeholder="Note title..."
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="content" className="text-right">Content</Label>
                  <Textarea 
                    id="content" 
                    value={newNoteContent} 
                    onChange={(e) => setNewNoteContent(e.target.value)} 
                    placeholder="Write your note content here..."
                    className="col-span-3 min-h-[150px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateNote}>Create Note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex gap-4 h-full">
        {/* Notes Sidebar */}
        <Card className="w-1/3 overflow-hidden">
          <CardHeader className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pinned">Pinned</TabsTrigger>
                <TabsTrigger value="starred">Starred</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="p-0 overflow-y-auto h-[calc(100vh-270px)]">
            {filteredNotes.length > 0 ? (
              <div className="divide-y">
                {filteredNotes.map(note => (
                  <div key={note.id} 
                    className={`p-4 cursor-pointer hover:bg-muted transition-colors ${activeNote?.id === note.id ? 'bg-muted' : ''}`}
                    onClick={() => handleSelectNote(note)}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium line-clamp-1">{note.title}</h3>
                      <div className="flex items-center gap-1">
                        {note.pinned && <span className="text-blue-500">📌</span>}
                        {note.starred && <span className="text-yellow-500">⭐</span>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{note.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {note.tags.length > 2 && <Badge variant="outline" className="text-xs">+{note.tags.length - 2}</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No notes found</p>
                <Button variant="outline" className="mt-2" onClick={() => setShowTemplates(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Note Editor */}
        <Card className="flex-1">
          {activeNote ? (
            <div className="h-full flex flex-col">
              <CardHeader className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <Input 
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="text-xl font-bold"
                        placeholder="Note title"
                      />
                    ) : (
                      <CardTitle>{activeNote.title}</CardTitle>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleStar(activeNote.id)}
                        >
                          <Star className={`h-4 w-4 ${activeNote.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleTogglePin(activeNote.id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${activeNote.pinned ? 'fill-blue-500 text-blue-500' : ''}`}>
                            <path d="M9.62129 1.13607C9.81656 0.940808 10.1331 0.940809 10.3284 1.13607L13.8639 4.67157C14.0592 4.86683 14.0592 5.18341 13.8639 5.37868C13.6687 5.57394 13.3521 5.57394 13.1568 5.37868L9.97483 2.19672L6.37525 5.79629C6.22894 5.9426 6.0312 6.01746 5.82491 6.00014C5.61862 5.98282 5.43209 5.8751 5.31286 5.7051L4.79553 4.91753L2.2699 7.44316C2.07464 7.63842 1.75806 7.63842 1.56279 7.44316C1.36753 7.2479 1.36753 6.93131 1.56279 6.73605L4.32583 3.97301C4.45337 3.84547 4.63255 3.78947 4.81183 3.82227C4.9911 3.85506 5.14628 3.97252 5.22957 4.1367L5.74689 4.92427L9.62129 1.13607ZM9.97483 6.08302C9.77957 5.88776 9.46298 5.88776 9.26772 6.08302C9.07246 6.27828 9.07246 6.59487 9.26772 6.79013L10.6109 8.13332C10.8062 8.32858 10.8062 8.64516 10.6109 8.84043C10.4157 9.03569 10.0991 9.03569 9.90385 8.84043L8.56066 7.49723C8.1702 7.10677 8.1702 6.47008 8.56066 6.07961C8.95112 5.68915 9.58781 5.68915 9.97828 6.07961L10.0426 6.14388L11.3345 7.43582L13.1568 5.61357C13.352 5.41831 13.6686 5.41831 13.8639 5.61357C14.0591 5.80883 14.0591 6.12542 13.8639 6.32068L11.8284 8.35619C11.6331 8.55145 11.3166 8.55145 11.1213 8.35619L9.97483 7.20973L9.97483 6.08302ZM1.06555 13.9344C1.06555 13.3822 1.5133 12.9344 2.06555 12.9344H12.9344C13.4866 12.9344 13.9344 13.3822 13.9344 13.9344C13.9344 14.4866 13.4866 14.9344 12.9344 14.9344H2.06555C1.5133 14.9344 1.06555 14.4866 1.06555 13.9344Z" />
                          </svg>
                        </Button>
                      </>
                    )}
                    
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={handleEditNote}>
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditNote()}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* share functionality */}}>
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* duplicate functionality */}}>
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDeleteNote(activeNote.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center text-xs text-muted-foreground gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Created {format(new Date(activeNote.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Updated {format(new Date(activeNote.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex items-center mt-4 border p-1 rounded-md">
                    <div className="flex items-center gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-sm ${editorState.isBold ? 'bg-muted' : ''}`} 
                        onClick={() => formatText('bold')}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-sm ${editorState.isItalic ? 'bg-muted' : ''}`} 
                        onClick={() => formatText('italic')}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-sm ${editorState.isUnderline ? 'bg-muted' : ''}`} 
                        onClick={() => formatText('underline')}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <span className="w-px h-6 bg-border mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('heading')}>
                        <Heading2 className="h-4 w-4" />
                      </Button>
                      <span className="w-px h-6 bg-border mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('bulletList')}>
                        <List className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('numberedList')}>
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <span className="w-px h-6 bg-border mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('alignLeft')}>
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('alignCenter')}>
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('alignRight')}>
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <span className="w-px h-6 bg-border mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('image')}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => formatText('settings')}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {activeNote.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      {isEditing && (
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-xs">
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                  {isEditing && (
                    <div className="flex items-center">
                      <Input
                        value={newNoteTag}
                        onChange={(e) => setNewNoteTag(e.target.value)}
                        placeholder="Add tag..."
                        className="h-7 w-24 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button variant="ghost" size="sm" onClick={handleAddTag}>
                        +
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 overflow-y-auto flex-1">
                {isEditing ? (
                  <Textarea 
                    value={newNoteContent} 
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[300px] border-none focus-visible:ring-0 resize-none h-full"
                    placeholder="Write your note content here..."
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {activeNote.content.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Note Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a note from the sidebar or create a new one to get started.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-title" className="text-right">Title</Label>
                      <Input 
                        id="new-title" 
                        value={newNoteTitle} 
                        onChange={(e) => setNewNoteTitle(e.target.value)} 
                        placeholder="Note title..."
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-content" className="text-right">Content</Label>
                      <Textarea 
                        id="new-content" 
                        value={newNoteContent} 
                        onChange={(e) => setNewNoteContent(e.target.value)} 
                        placeholder="Write your note content here..."
                        className="col-span-3 min-h-[150px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateNote}>Create Note</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Notes;
