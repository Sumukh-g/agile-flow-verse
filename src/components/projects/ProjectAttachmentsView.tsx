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
    Grid,
    HardDrive,
    List,
    MoreHorizontal,
    Paperclip,
    Search,
    Share,
    Star,
    Trash2,
    Upload,
    User
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useProjectAttachments, useUploadAttachment, useDeleteAttachment, useDownloadAttachment, useStorageStats } from '@/hooks/useAttachments';

interface ProjectAttachmentsViewProps {
  projectId: string | undefined;
}

const ProjectAttachmentsView: React.FC<ProjectAttachmentsViewProps> = ({ projectId }) => {
  // Real API hooks
  const { data: attachmentsData, isLoading } = useProjectAttachments(projectId, { limit: 100 });
  const { data: storageStats } = useStorageStats();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const downloadAttachment = useDownloadAttachment();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const attachments = attachmentsData?.attachments || [];
  
  // Calculate storage stats from actual attachments
  const totalSizeBytes = attachments.reduce((sum, att) => sum + (att.sizeBytes || 0), 0);
  const totalSizeMB = totalSizeBytes / (1024 * 1024);
  const sharedFilesCount = 0; // Shared functionality not yet implemented
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const filteredAttachments = attachments.filter(attachment => {
    const matchesSearch = attachment.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || 
      (typeFilter === "document" && (attachment.mimeType?.includes("document") || attachment.mimeType?.includes("pdf") || attachment.mimeType?.includes("text"))) ||
      (typeFilter === "image" && attachment.mimeType?.startsWith("image/")) ||
      (typeFilter === "video" && attachment.mimeType?.startsWith("video/")) ||
      (typeFilter === "design" && (attachment.mimeType?.includes("image") || attachment.mimeType?.includes("svg"))) ||
      (typeFilter === "spreadsheet" && (attachment.mimeType?.includes("spreadsheet") || attachment.mimeType?.includes("excel") || attachment.mimeType?.includes("csv")));
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "recent" && new Date(attachment.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                      (activeTab === "starred" && false) || // Starred functionality not yet implemented
                      (activeTab === "shared" && false); // Shared functionality not yet implemented
    
    return matchesSearch && matchesType && matchesTab;
  });

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileArray = Array.from(files);
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Validate file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
          toast.error(`File "${file.name}" exceeds 100MB limit`);
          errorCount++;
          continue;
        }
        
        setUploadProgress(((i + 1) / fileArray.length) * 100);
        
        try {
          await uploadAttachment.mutateAsync({
            file,
            metadata: { projectId },
          });
          successCount++;
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          errorCount++;
          toast.error(`Failed to upload "${file.name}": ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
        }
      }
      
      if (successCount > 0) {
        // Close dialog after successful uploads
        setIsUploadOpen(false);
        // The mutation hook will show individual success toasts
        if (successCount < fileArray.length) {
          toast.warning(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
        }
      } else if (errorCount > 0) {
        // All files failed
        toast.error(`Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}`);
      }
      
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [projectId, uploadAttachment]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await deleteAttachment.mutateAsync(id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete file');
    }
  }, [deleteAttachment]);

  const handleDownload = useCallback(async (id: string, filename: string) => {
    try {
      const blob = await downloadAttachment.mutateAsync(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to download file');
    }
  }, [downloadAttachment]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <FileImage className="h-8 w-8 text-green-500" />;
    if (mimeType?.startsWith('video/')) return <FileVideo className="h-8 w-8 text-purple-500" />;
    if (mimeType?.includes('pdf') || mimeType?.includes('document') || mimeType?.includes('text')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <FileText className="h-8 w-8 text-green-600" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const getTypeColor = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return 'bg-green-100 text-green-800';
    if (mimeType?.startsWith('video/')) return 'bg-purple-100 text-purple-800';
    if (mimeType?.includes('pdf') || mimeType?.includes('document') || mimeType?.includes('text')) return 'bg-blue-100 text-blue-800';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };


  const UploadForm = () => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    }, [handleFileUpload]);

    return (
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-muted-foreground mb-4">Support for all file types (images, documents, videos, archives, etc.) up to 100MB each</p>
          <Button variant="outline" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading files...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</Button>
        </div>
      </div>
    );
  };


  const AttachmentCard = ({ attachment }: { attachment: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getFileIcon(attachment.mimeType)}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{attachment.filename}</h3>
              <p className="text-sm text-muted-foreground">{formatFileSize(attachment.sizeBytes)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => handleDelete(attachment.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge className={getTypeColor(attachment.mimeType)}>
            {attachment.mimeType?.split('/')[1] || 'file'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => {
              setSelectedAttachment(attachment);
              setIsPreviewOpen(true);
            }}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDownload(attachment.id, attachment.filename)}>
              <Download className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(attachment.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AttachmentListItem = ({ attachment }: { attachment: any }) => (
    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getFileIcon(attachment.mimeType)}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{attachment.filename}</h3>
          <p className="text-sm text-muted-foreground">{formatFileSize(attachment.sizeBytes)} • {new Date(attachment.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Badge className={getTypeColor(attachment.mimeType)}>
          {attachment.mimeType?.split('/')[1] || 'file'}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => {
          setSelectedAttachment(attachment);
          setIsPreviewOpen(true);
        }}>
          <Eye className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDownload(attachment.id, attachment.filename)}>
          <Download className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(attachment.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );


  const AttachmentPreview = ({ attachment }: { attachment: any }) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getFileIcon(attachment.mimeType)}
          <div>
            <h3 className="text-lg font-semibold">{attachment.filename}</h3>
            <p className="text-muted-foreground">{attachment.mimeType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getTypeColor(attachment.mimeType)}>
            {attachment.mimeType?.split('/')[1] || 'file'}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Size</p>
          <p className="font-medium">{formatFileSize(attachment.sizeBytes || 0)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Upload date</p>
          <p className="font-medium">{new Date(attachment.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">File type</p>
          <p className="font-medium">{attachment.mimeType?.split('/')[0] || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">ID</p>
          <p className="font-medium text-xs truncate">{attachment.id}</p>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => handleDownload(attachment.id, attachment.filename)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="destructive" onClick={() => {
          if (confirm('Are you sure you want to delete this file?')) {
            handleDelete(attachment.id);
            setIsPreviewOpen(false);
          }
        }}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold">
                  {totalSizeMB < 0.1 ? '0 MB' : totalSizeMB.toFixed(1) + ' MB'}
                </p>
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
                <p className="text-2xl font-bold">{sharedFilesCount}</p>
              </div>
              <Share className="h-8 w-8 text-green-500" />
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


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Paperclip className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">Loading attachments...</h3>
                <p className="text-muted-foreground text-center">
                  Please wait while we load your files
                </p>
              </CardContent>
            </Card>
          ) : filteredAttachments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Paperclip className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || typeFilter !== "all"
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