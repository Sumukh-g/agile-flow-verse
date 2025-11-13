import AdvancedPageEditor from '@/components/pages/AdvancedPageEditor';
import FileUpload from '@/components/pages/FileUpload';
import ImageGallery from '@/components/pages/ImageGallery';
import RealTimeCollaboration from '@/components/pages/RealTimeCollaboration';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Archive,
    ArrowLeft,
    Download,
    Edit,
    Eye,
    File,
    FileText,
    Folder,
    Grid,
    Image,
    List,
    MoreVertical,
    Plus,
    Search,
    Share2,
    Star,
    Trash2,
    Video
} from 'lucide-react';
import { useState } from 'react';
import { toast } from "sonner";

interface Page {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'folder' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'presentation';
  tags: string[];
  lastUpdated: string;
  updatedBy: string;
  parent?: string;
  content?: any[];
  isStarred?: boolean;
  isPublic?: boolean;
  collaborators?: string[];
  size?: number;
  thumbnail?: string;
  permissions?: 'view' | 'edit' | 'admin';
}

const INITIAL_PAGES: Page[] = [
  {
    id: 'p1',
    title: 'Project Documentation',
    description: 'Overview of project goals and requirements',
    type: 'document',
    tags: ['Documentation', 'Project'],
    lastUpdated: '2 days ago',
    updatedBy: 'JD',
    isStarred: true,
    isPublic: false,
    collaborators: ['JD', 'AS'],
    permissions: 'edit'
  },
  {
    id: 'p2',
    title: 'Meeting Notes',
    description: 'Collection of meeting notes and action items',
    type: 'folder',
    tags: ['Meetings'],
    lastUpdated: '1 week ago',
    updatedBy: 'AS',
    isStarred: false,
    isPublic: false,
    collaborators: ['AS', 'RM'],
    permissions: 'view'
  },
  {
    id: 'p3',
    title: 'Design Guidelines',
    description: 'Brand and UI design guidelines',
    type: 'document',
    tags: ['Design', 'Brand'],
    lastUpdated: '3 days ago',
    updatedBy: 'RM',
    isStarred: true,
    isPublic: true,
    collaborators: ['RM', 'TW'],
    permissions: 'edit'
  },
  {
    id: 'p4',
    title: 'Team Resources',
    description: 'Shared resources for the team',
    type: 'folder',
    tags: ['Resources'],
    lastUpdated: '5 days ago',
    updatedBy: 'TW',
    isStarred: false,
    isPublic: false,
    collaborators: ['TW'],
    permissions: 'admin'
  },
  {
    id: 'p5',
    title: 'Project Plan',
    description: 'Detailed project timeline and milestones',
    type: 'document',
    tags: ['Planning', 'Project'],
    lastUpdated: '1 day ago',
    updatedBy: 'JD',
    isStarred: false,
    isPublic: false,
    collaborators: ['JD'],
    permissions: 'edit'
  },
  {
    id: 'p6',
    title: 'Screenshots',
    description: 'UI screenshots and mockups',
    type: 'image',
    tags: ['UI', 'Screenshots'],
    lastUpdated: '4 days ago',
    updatedBy: 'RM',
    isStarred: false,
    isPublic: true,
    collaborators: ['RM'],
    permissions: 'view',
    size: 2048000,
    thumbnail: '/api/placeholder/200/150'
  },
  {
    id: 'p7',
    title: 'Demo Video',
    description: 'Product demonstration video',
    type: 'video',
    tags: ['Demo', 'Video'],
    lastUpdated: '1 week ago',
    updatedBy: 'AS',
    isStarred: true,
    isPublic: true,
    collaborators: ['AS'],
    permissions: 'view',
    size: 15728640,
    thumbnail: '/api/placeholder/200/150'
  }
];

const PagesDirectory = () => {
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [newPage, setNewPage] = useState({
    title: '',
    description: '',
    type: 'document',
    tags: '',
    isPublic: false
  });

  const filteredPages = pages.filter(page => {
    const matchesSearch = 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesFolder = page.parent === currentFolder;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'starred' && page.isStarred) ||
      (activeTab === 'public' && page.isPublic) ||
      (activeTab === 'recent' && page.lastUpdated.includes('day')) ||
      (activeTab === 'my' && page.updatedBy === 'You');
    
    return currentFolder 
      ? matchesSearch && matchesFolder
      : matchesSearch && !page.parent && matchesTab;
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
      type: newPage.type as Page['type'],
      tags: newPage.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      lastUpdated: 'Just now',
      updatedBy: 'You',
      parent: currentFolder,
      isStarred: false,
      isPublic: newPage.isPublic,
      collaborators: ['You'],
      permissions: 'admin'
    };

    setPages(prev => [newPageItem, ...prev]);
    setNewPage({
      title: '',
      description: '',
      type: 'document',
      tags: '',
      isPublic: false
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
    toast.success('Page deleted successfully');
  };

  const handleEditPage = (page: Page) => {
    setSelectedPage(page);
    setEditDialogOpen(true);
  };

  const handleUpdatePage = () => {
    if (!selectedPage) return;
    
    setPages(prev => prev.map(page => 
      page.id === selectedPage.id ? selectedPage : page
    ));
    setEditDialogOpen(false);
    setSelectedPage(null);
    toast.success('Page updated successfully');
  };

  const handleStarPage = (pageId: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, isStarred: !page.isStarred } : page
    ));
  };

  const handleSharePage = (pageId: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, isPublic: !page.isPublic } : page
    ));
    toast.success('Page sharing updated');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="h-5 w-5 text-blue-500" />;
      case 'image': return <Image className="h-5 w-5 text-green-500" />;
      case 'video': return <Video className="h-5 w-5 text-purple-500" />;
      case 'audio': return <File className="h-5 w-5 text-orange-500" />;
      case 'archive': return <Archive className="h-5 w-5 text-red-500" />;
      case 'code': return <FileText className="h-5 w-5 text-indigo-500" />;
      case 'presentation': return <FileText className="h-5 w-5 text-pink-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentFolderData = currentFolder ? pages.find(p => p.id === currentFolder) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">
            {currentFolderData ? `Inside ${currentFolderData.title}` : 'Manage your documents and files'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {currentFolder && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Button variant="ghost" size="sm" onClick={handleNavigateBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span>/</span>
          <span>{currentFolderData?.title}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="my">My Pages</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPages.map((page) => (
                <Card key={page.id} className="group hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(page.type)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">{page.title}</CardTitle>
                          <CardDescription className="text-xs truncate">
                            {page.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {page.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        {page.isPublic && <Share2 className="h-4 w-4 text-green-500" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPage(page)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStarPage(page.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {page.isStarred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSharePage(page.id)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              {page.isPublic ? 'Make Private' : 'Make Public'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeletePage(page.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {page.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {page.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{page.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{page.lastUpdated}</span>
                        <span>by {page.updatedBy}</span>
                      </div>
                      {page.size && (
                        <div className="text-xs text-gray-500">
                          {formatFileSize(page.size)}
                        </div>
                      )}
                      {page.thumbnail && (
                        <img 
                          src={page.thumbnail} 
                          alt={page.title}
                          className="w-full h-20 object-cover rounded"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPages.map((page) => (
                <Card key={page.id} className="group hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(page.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium truncate">{page.title}</h3>
                          {page.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          {page.isPublic && <Share2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{page.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{page.lastUpdated}</span>
                          <span>by {page.updatedBy}</span>
                          {page.size && <span>{formatFileSize(page.size)}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {page.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPage(page)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStarPage(page.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {page.isStarred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSharePage(page.id)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              {page.isPublic ? 'Make Private' : 'Make Public'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeletePage(page.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Page Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a new document, folder, or upload files to your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newPage.title}
                  onChange={(e) => setNewPage(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter page title"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={newPage.type}
                  onChange={(e) => setNewPage(prev => ({ ...prev, type: e.target.value as Page['type'] }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="document">Document</option>
                  <option value="folder">Folder</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="archive">Archive</option>
                  <option value="code">Code</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newPage.description}
                onChange={(e) => setNewPage(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter page description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={newPage.tags}
                onChange={(e) => setNewPage(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newPage.isPublic}
                onChange={(e) => setNewPage(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublic">Make this page public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage}>
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Page Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page: {selectedPage?.title}</DialogTitle>
            <DialogDescription>
              Edit your page content and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedPage && (
            <Tabs defaultValue="content" className="w-full">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <AdvancedPageEditor
                  initialContent={selectedPage.content || []}
                  onSave={(content) => {
                    setSelectedPage(prev => prev ? { ...prev, content } : null);
                  }}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={selectedPage.title}
                      onChange={(e) => setSelectedPage(prev => prev ? { ...prev, title: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type">Type</Label>
                    <select
                      id="edit-type"
                      value={selectedPage.type}
                      onChange={(e) => setSelectedPage(prev => prev ? { ...prev, type: e.target.value as Page['type'] } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="document">Document</option>
                      <option value="folder">Folder</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="archive">Archive</option>
                      <option value="code">Code</option>
                      <option value="presentation">Presentation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedPage.description}
                    onChange={(e) => setSelectedPage(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    value={selectedPage.tags.join(', ')}
                    onChange={(e) => setSelectedPage(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()) } : null)}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-starred"
                      checked={selectedPage.isStarred}
                      onChange={(e) => setSelectedPage(prev => prev ? { ...prev, isStarred: e.target.checked } : null)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-starred">Starred</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-public"
                      checked={selectedPage.isPublic}
                      onChange={(e) => setSelectedPage(prev => prev ? { ...prev, isPublic: e.target.checked } : null)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-public">Public</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="collaborators" className="space-y-4">
                <RealTimeCollaboration
                  pageId={selectedPage.id}
                  currentUser={{
                    id: 'current-user',
                    name: 'Current User',
                    email: 'current@example.com',
                    role: 'owner',
                    isOnline: true,
                    color: '#3B82F6'
                  }}
                  onCollaboratorsChange={() => {}}
                  onCommentsChange={() => {}}
                  onActivityChange={() => {}}
                />
              </TabsContent>
              
              <TabsContent value="files" className="space-y-4">
                <FileUpload
                  onFilesUploaded={(files) => {
                    toast.success(`${files.length} file(s) uploaded`);
                  }}
                />
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4">
                <ImageGallery
                  onImagesUploaded={(images) => {
                    toast.success(`${images.length} image(s) uploaded`);
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePage}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesDirectory;