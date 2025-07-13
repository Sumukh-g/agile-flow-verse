import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import {
    Calendar,
    Download,
    Edit,
    Eye,
    File,
    FileImage,
    FileText,
    FileVideo,
    Folder,
    Grid,
    HardDrive,
    List,
    MoreHorizontal,
    Paperclip,
    Search,
    Share,
    Star,
    Upload,
    User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectAttachmentsViewProps {
  projectId: string | undefined;
}

const ProjectAttachmentsView: React.FC<ProjectAttachmentsViewProps> = ({ projectId }) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Mock attachments data
    setAttachments([
      {
        id: 1,
        name: "Project Requirements.pdf",
        type: "document",
        size: "2.4 MB",
        uploadedBy: "John Smith",
        uploadedDate: "2024-01-15",
        lastModified: "2024-01-15",
        folder: "Documents",
        tags: ["requirements", "planning"],
        isStarred: true,
        isShared: true,
        sharedWith: ["Sarah Johnson", "Mike Wilson"],
        downloadCount: 12,
        version: "1.0",
        description: "Initial project requirements document"
      },
      {
        id: 2,
        name: "UI Mockups.fig",
        type: "design",
        size: "15.7 MB",
        uploadedBy: "Lisa Brown",
        uploadedDate: "2024-01-12",
        lastModified: "2024-01-14",
        folder: "Design",
        tags: ["ui", "mockups", "figma"],
        isStarred: false,
        isShared: true,
        sharedWith: ["John Smith", "Sarah Johnson"],
        downloadCount: 8,
        version: "2.1",
        description: "User interface design mockups"
      },
      {
        id: 3,
        name: "Demo Video.mp4",
        type: "video",
        size: "45.2 MB",
        uploadedBy: "Mike Wilson",
        uploadedDate: "2024-01-10",
        lastModified: "2024-01-10",
        folder: "Media",
        tags: ["demo", "presentation"],
        isStarred: true,
        isShared: false,
        sharedWith: [],
        downloadCount: 25,
        version: "1.0",
        description: "Product demonstration video"
      },
      {
        id: 4,
        name: "Architecture Diagram.png",
        type: "image",
        size: "1.8 MB",
        uploadedBy: "Tom Davis",
        uploadedDate: "2024-01-08",
        lastModified: "2024-01-13",
        folder: "Technical",
        tags: ["architecture", "diagram", "technical"],
        isStarred: false,
        isShared: true,
        sharedWith: ["John Smith", "Mike Wilson"],
        downloadCount: 15,
        version: "1.2",
        description: "System architecture overview"
      },
      {
        id: 5,
        name: "Meeting Notes.docx",
        type: "document",
        size: "0.8 MB",
        uploadedBy: "Sarah Johnson",
        uploadedDate: "2024-01-14",
        lastModified: "2024-01-14",
        folder: "Documents",
        tags: ["meeting", "notes"],
        isStarred: false,
        isShared: true,
        sharedWith: ["Team"],
        downloadCount: 6,
        version: "1.0",
        description: "Weekly team meeting notes"
      },
      {
        id: 6,
        name: "Budget Spreadsheet.xlsx",
        type: "spreadsheet",
        size: "1.2 MB",
        uploadedBy: "Emma Davis",
        uploadedDate: "2024-01-11",
        lastModified: "2024-01-15",
        folder: "Finance",
        tags: ["budget", "finance", "planning"],
        isStarred: true,
        isShared: false,
        sharedWith: [],
        downloadCount: 4,
        version: "1.3",
        description: "Project budget breakdown"
      }
    ]);

    setFolders([
      { id: 1, name: "Documents", itemCount: 2, color: "blue" },
      { id: 2, name: "Design", itemCount: 1, color: "purple" },
      { id: 3, name: "Media", itemCount: 1, color: "green" },
      { id: 4, name: "Technical", itemCount: 1, color: "orange" },
      { id: 5, name: "Finance", itemCount: 1, color: "red" }
    ]);
  }, [projectId]);

  const filteredAttachments = attachments.filter(attachment => {
    const matchesSearch = attachment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attachment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attachment.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === "all" || attachment.type === typeFilter;
    const matchesFolder = folderFilter === "all" || attachment.folder === folderFilter;
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "starred" && attachment.isStarred) ||
                      (activeTab === "shared" && attachment.isShared) ||
                      (activeTab === "recent" && new Date(attachment.uploadedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesType && matchesFolder && matchesTab;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-8 w-8 text-blue-500" />;
      case 'image': return <FileImage className="h-8 w-8 text-green-500" />;
      case 'video': return <FileVideo className="h-8 w-8 text-purple-500" />;
      case 'design': return <FileImage className="h-8 w-8 text-pink-500" />;
      case 'spreadsheet': return <FileText className="h-8 w-8 text-green-600" />;
      default: return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'design': return 'bg-pink-100 text-pink-800';
      case 'spreadsheet': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFolderColor = (color: string) => {
    const colors: { [key: string]: string } = {
      'blue': 'bg-blue-100 text-blue-800 border-blue-200',
      'purple': 'bg-purple-100 text-purple-800 border-purple-200',
      'green': 'bg-green-100 text-green-800 border-green-200',
      'orange': 'bg-orange-100 text-orange-800 border-orange-200',
      'red': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const UploadForm = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
        <p className="text-sm text-muted-foreground mb-4">Support for multiple file types up to 100MB each</p>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
      </div>
      
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="folder">Folder</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.name}>{folder.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" placeholder="Enter tags (comma separated)" />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="File description (optional)" />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="shared" />
          <Label htmlFor="shared">Share with team</Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          setIsUploading(true);
          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              setUploadProgress(0);
              toast.success("Files uploaded successfully!");
              setIsUploadOpen(false);
            }
          }, 200);
        }}>Upload Files</Button>
      </div>
    </div>
  );

  const CreateFolderForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="folderName">Folder Name</Label>
        <Input id="folderName" placeholder="Enter folder name" />
      </div>
      <div>
        <Label htmlFor="folderColor">Color</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="purple">Purple</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="folderDescription">Description</Label>
        <Textarea id="folderDescription" placeholder="Folder description (optional)" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          toast.success("Folder created successfully!");
          setIsCreateFolderOpen(false);
        }}>Create Folder</Button>
      </div>
    </div>
  );

  const AttachmentCard = ({ attachment }: { attachment: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getFileIcon(attachment.type)}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{attachment.name}</h3>
              <p className="text-sm text-muted-foreground">{attachment.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {attachment.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge className={getTypeColor(attachment.type)}>
            {attachment.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            v{attachment.version}
          </Badge>
          {attachment.tags.slice(0, 2).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {attachment.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{attachment.uploadedBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{attachment.uploadedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{attachment.downloadCount} downloads</span>
          </div>
          <div className="flex items-center gap-1">
            <Folder className="h-3 w-3" />
            <span>{attachment.folder}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex items-center gap-1">
            {attachment.isShared && (
              <>
                <Share className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {attachment.sharedWith.length} shared
                </span>
              </>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => {
              setSelectedAttachment(attachment);
              setIsPreviewOpen(true);
            }}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Download className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <Share className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AttachmentListItem = ({ attachment }: { attachment: any }) => (
    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getFileIcon(attachment.type)}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{attachment.name}</h3>
          <p className="text-sm text-muted-foreground">{attachment.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{attachment.size}</span>
        <span>{attachment.uploadedBy}</span>
        <span>{attachment.uploadedDate}</span>
        <Badge className={getTypeColor(attachment.type)}>
          {attachment.type}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1">
        {attachment.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
        <Button variant="ghost" size="sm">
          <Eye className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const FolderCard = ({ folder }: { folder: any }) => (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${getFolderColor(folder.color)}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <Folder className="h-8 w-8" />
          <div>
            <h3 className="font-semibold">{folder.name}</h3>
            <p className="text-sm text-muted-foreground">{folder.itemCount} items</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AttachmentPreview = ({ attachment }: { attachment: any }) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getFileIcon(attachment.type)}
          <div>
            <h3 className="text-lg font-semibold">{attachment.name}</h3>
            <p className="text-muted-foreground">{attachment.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getTypeColor(attachment.type)}>
            {attachment.type}
          </Badge>
          <Badge variant="outline">v{attachment.version}</Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Size</p>
          <p className="font-medium">{attachment.size}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Uploaded by</p>
          <p className="font-medium">{attachment.uploadedBy}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Upload date</p>
          <p className="font-medium">{attachment.uploadedDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Downloads</p>
          <p className="font-medium">{attachment.downloadCount}</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {attachment.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>
      
      {attachment.isShared && (
        <div>
          <h4 className="font-medium mb-2">Shared with</h4>
          <div className="flex flex-wrap gap-2">
            {attachment.sharedWith.map((person: string, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{person.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{person}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline">
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attachments</h2>
          <p className="text-muted-foreground">Manage project files, documents, and media</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Organize your files with a new folder
                </DialogDescription>
              </DialogHeader>
              <CreateFolderForm />
            </DialogContent>
          </Dialog>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Add files to your project
                </DialogDescription>
              </DialogHeader>
              <UploadForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{attachments.length}</p>
              </div>
              <Paperclip className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">67.3 MB</p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shared Files</p>
                <p className="text-2xl font-bold">{attachments.filter(a => a.isShared).length}</p>
              </div>
              <Share className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Folders</p>
                <p className="text-2xl font-bold">{folders.length}</p>
              </div>
              <Folder className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
            </SelectContent>
          </Select>
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.name}>{folder.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Folders */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Folders</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAttachments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Paperclip className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || typeFilter !== "all" || folderFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Upload your first file to get started"
                  }
                </p>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAttachments.map((attachment) => (
                    <AttachmentCard key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAttachments.map((attachment) => (
                    <AttachmentListItem key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* File Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          {selectedAttachment && <AttachmentPreview attachment={selectedAttachment} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectAttachmentsView; 