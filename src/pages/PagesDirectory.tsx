
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, Filter, Plus, FileText, Folder, Settings, MoreVertical } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'folder';
  tags: string[];
  lastUpdated: string;
  updatedBy: string;
  parent?: string;
}

const INITIAL_PAGES: Page[] = [
  {
    id: 'p1',
    title: 'Project Documentation',
    description: 'Overview of project goals and requirements',
    type: 'document',
    tags: ['Documentation', 'Project'],
    lastUpdated: '2 days ago',
    updatedBy: 'JD'
  },
  {
    id: 'p2',
    title: 'Meeting Notes',
    description: 'Collection of meeting notes and action items',
    type: 'folder',
    tags: ['Meetings'],
    lastUpdated: '1 week ago',
    updatedBy: 'AS'
  },
  {
    id: 'p3',
    title: 'Design Guidelines',
    description: 'Brand and UI design guidelines',
    type: 'document',
    tags: ['Design', 'Brand'],
    lastUpdated: '3 days ago',
    updatedBy: 'RM'
  },
  {
    id: 'p4',
    title: 'Team Resources',
    description: 'Shared resources for the team',
    type: 'folder',
    tags: ['Resources'],
    lastUpdated: '5 days ago',
    updatedBy: 'TW'
  },
  {
    id: 'p5',
    title: 'Project Plan',
    description: 'Detailed project timeline and milestones',
    type: 'document',
    tags: ['Planning', 'Project'],
    lastUpdated: '1 day ago',
    updatedBy: 'JD'
  }
];

const PagesDirectory = () => {
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPage, setNewPage] = useState({
    title: '',
    description: '',
    type: 'document',
    tags: ''
  });

  const filteredPages = pages.filter(page => {
    const matchesSearch = 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesFolder = page.parent === currentFolder;
    
    return currentFolder 
      ? matchesSearch && matchesFolder
      : matchesSearch && !page.parent;
  });

  const handleCreatePage = () => {
    if (!newPage.title.trim()) {
      toast.error('Page title is required');
      return;
    }

    const newPageItem: Page = {
      id: `p${Date.now()}`,
      title: newPage.title,
      description: newPage.description,
      type: newPage.type as 'document' | 'folder',
      tags: newPage.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      lastUpdated: 'Just now',
      updatedBy: 'You',
      parent: currentFolder
    };

    setPages(prev => [newPageItem, ...prev]);
    setNewPage({
      title: '',
      description: '',
      type: 'document',
      tags: ''
    });
    setCreateDialogOpen(false);
    toast.success(`${newPage.type === 'document' ? 'Document' : 'Folder'} created successfully`);
  };

  const handleOpenFolder = (folderId: string) => {
    setCurrentFolder(folderId);
  };

  const handleNavigateBack = () => {
    const parentFolder = pages.find(page => page.id === currentFolder)?.parent;
    setCurrentFolder(parentFolder);
  };

  const handleDeletePage = (pageId: string) => {
    setPages(prev => prev.filter(page => page.id !== pageId));
    toast.success('Item deleted');
  };

  const getBreadcrumbPath = () => {
    const path = [];
    
    let current = currentFolder;
    while (current) {
      const folder = pages.find(page => page.id === current);
      if (folder) {
        path.unshift({
          id: folder.id,
          title: folder.title
        });
        current = folder.parent;
      } else {
        break;
      }
    }
    
    return path;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
        <p className="text-muted-foreground">
          Manage and organize your documents and knowledge base.
        </p>
      </div>

      {/* Breadcrumb navigation */}
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          className="h-auto p-1"
          onClick={() => setCurrentFolder(undefined)}
        >
          Home
        </Button>
        
        {currentFolder && getBreadcrumbPath().map((item, index) => (
          <React.Fragment key={item.id}>
            <span>/</span>
            <Button 
              variant="ghost" 
              className="h-auto p-1"
              onClick={() => setCurrentFolder(item.id)}
            >
              {item.title}
            </Button>
          </React.Fragment>
        ))}
      </nav>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pages..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Page</DialogTitle>
                <DialogDescription>
                  Create a new document or folder to organize your content.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-4 mb-2">
                  <Button
                    type="button"
                    variant={newPage.type === 'document' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setNewPage(prev => ({ ...prev, type: 'document' }))}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Document
                  </Button>
                  <Button
                    type="button"
                    variant={newPage.type === 'folder' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setNewPage(prev => ({ ...prev, type: 'folder' }))}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Folder
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter title"
                    value={newPage.title}
                    onChange={(e) => setNewPage(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter description"
                    value={newPage.description}
                    onChange={(e) => setNewPage(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">
                    Tags <span className="text-muted-foreground">(comma separated)</span>
                  </Label>
                  <Input 
                    id="tags" 
                    placeholder="Enter tags"
                    value={newPage.tags}
                    onChange={(e) => setNewPage(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                
                {currentFolder && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    Creating in: {pages.find(p => p.id === currentFolder)?.title || 'Root'}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePage}>
                  Create {newPage.type === 'document' ? 'Document' : 'Folder'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pages grid/list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page) => (
          <Card key={page.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {page.type === 'document' ? (
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    ) : (
                      <Folder className="h-5 w-5 mr-2 text-amber-500" />
                    )}
                    <h3 className="font-medium">{page.title}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {page.type === 'folder' && (
                        <DropdownMenuItem onClick={() => handleOpenFolder(page.id)}>
                          Open
                        </DropdownMenuItem>
                      )}
                      {page.type === 'document' && (
                        <DropdownMenuItem onClick={() => toast.info(`Opening document: ${page.title}`)}>
                          View
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePage(page.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {page.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {page.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-muted/20 p-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated {page.lastUpdated}</span>
              <div className="flex items-center gap-1">
                <span>by</span>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {page.updatedBy}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {filteredPages.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-background">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No pages found</h3>
          <p className="mt-1 text-muted-foreground">
            {searchQuery ? 'Try a different search term or clear filters' : 'Create your first page to get started'}
          </p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Page
          </Button>
        </div>
      )}
    </div>
  );
};

export default PagesDirectory;
