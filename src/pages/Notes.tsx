
import React, { useState } from 'react';
import { PlusCircle, Folder, File, MoreVertical, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Note {
  id: string;
  title: string;
  content: string;
  isFolder: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const Notes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [isFolder, setIsFolder] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Project Ideas',
      content: '',
      isFolder: true,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Meeting Notes',
      content: '',
      isFolder: true,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Roadmap',
      content: 'Our product roadmap for the next quarter...',
      isFolder: false,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      title: 'Sprint Planning',
      content: 'Tasks for the upcoming sprint...',
      isFolder: false,
      parentId: '2',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [contentEditDialogOpen, setContentEditDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const handleCreateNote = () => {
    if (!noteTitle.trim()) {
      toast.error("Note title is required");
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle,
      content: '',
      isFolder,
      parentId: selectedParentId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNotes(prev => [...prev, newNote]);
    setCreateDialogOpen(false);
    setNoteTitle('');
    setIsFolder(false);
    setSelectedParentId(null);
    toast.success(`${isFolder ? 'Folder' : 'Note'} created successfully`);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setNoteContent(note.content);
    setContentEditDialogOpen(true);
  };

  const handleSaveContent = () => {
    if (!selectedNoteId) return;

    setNotes(prev => prev.map(note => 
      note.id === selectedNoteId 
        ? { ...note, content: noteContent, updatedAt: new Date() } 
        : note
    ));

    setContentEditDialogOpen(false);
    toast.success("Note content updated");
  };

  const handleDeleteNote = (id: string) => {
    // Check if this is a folder with children
    const hasChildren = notes.some(note => note.parentId === id);
    
    if (hasChildren) {
      toast.error("Cannot delete a folder that contains notes");
      return;
    }
    
    setNotes(prev => prev.filter(note => note.id !== id));
    toast.success("Note deleted successfully");
  };

  const getFolders = () => {
    return notes.filter(note => note.isFolder && note.parentId === null);
  };

  const getRootNotes = () => {
    return notes.filter(note => !note.isFolder && note.parentId === null);
  };

  const getChildNotes = (parentId: string) => {
    return notes.filter(note => note.parentId === parentId);
  };

  const handleOpenCreateDialog = (parentId: string | null = null, defaultIsFolder = false) => {
    setSelectedParentId(parentId);
    setIsFolder(defaultIsFolder);
    setCreateDialogOpen(true);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground">
          Create, organize, and manage your notes and documentation
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search notes..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => handleOpenCreateDialog(null, false)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Note
          </Button>
          <Button variant="outline" onClick={() => handleOpenCreateDialog(null, true)}>
            <Folder className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {/* List of folders */}
          {getFolders().map(folder => (
            <Card key={folder.id} className="mb-4">
              <CardContent className="p-0">
                <div className="p-4 font-medium flex items-center justify-between bg-muted/30">
                  <div className="flex items-center">
                    <Folder className="mr-2 h-5 w-5 text-blue-500" />
                    <span>{folder.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenCreateDialog(folder.id, false)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleOpenCreateDialog(folder.id, false)}>Add Note</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenCreateDialog(folder.id, true)}>Add Subfolder</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteNote(folder.id)} className="text-red-600">
                          Delete Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Child notes within this folder */}
                <div className="p-2">
                  {getChildNotes(folder.id).length > 0 ? (
                    getChildNotes(folder.id).map(childNote => (
                      <div key={childNote.id} 
                          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                          onClick={() => !childNote.isFolder && handleEditNote(childNote)}>
                        <div className="flex items-center">
                          {childNote.isFolder ? (
                            <Folder className="mr-2 h-4 w-4 text-blue-400" />
                          ) : (
                            <File className="mr-2 h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm">{childNote.title}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {!childNote.isFolder && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEditNote(childNote);
                              }}>
                                Edit Note
                              </DropdownMenuItem>
                            )}
                            {childNote.isFolder && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCreateDialog(childNote.id, false);
                                }}>
                                  Add Note
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCreateDialog(childNote.id, true);
                                }}>
                                  Add Subfolder
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(childNote.id);
                            }} className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No notes in this folder yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Root level notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getRootNotes().map(note => (
              <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleEditNote(note)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{note.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}>
                          Edit Note
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }} className="text-red-600">
                          Delete Note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-3">{note.content || "No content yet"}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-3xl font-bold mb-2">No notes yet</div>
              <p className="text-muted-foreground mb-4">Get started by creating your first note or folder</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => handleOpenCreateDialog(null, false)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Note
                </Button>
                <Button variant="outline" onClick={() => handleOpenCreateDialog(null, true)}>
                  <Folder className="mr-2 h-4 w-4" />
                  New Folder
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Your recently edited notes will appear here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="favorites">
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Your favorite notes will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Note/Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isFolder ? "Create New Folder" : "Create New Note"}</DialogTitle>
            <DialogDescription>
              {isFolder 
                ? "Create a folder to organize your notes." 
                : "Add a new note to your collection."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder={`Enter ${isFolder ? 'folder' : 'note'} title...`}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFolder"
                checked={isFolder}
                onChange={(e) => setIsFolder(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isFolder" className="text-sm font-medium">Create as folder</label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote}>
              Create {isFolder ? "Folder" : "Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Content Dialog */}
      <Dialog open={contentEditDialogOpen} onOpenChange={setContentEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {notes.find(note => note.id === selectedNoteId)?.title || "Edit Note"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note content here..."
              className="w-full h-[300px] p-2 border rounded-md"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContent}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
