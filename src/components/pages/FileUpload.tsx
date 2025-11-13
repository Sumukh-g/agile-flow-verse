import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Archive,
    Download,
    Eye,
    File,
    FileText,
    Image,
    Music,
    Upload,
    Video,
    X
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  maxFiles = 10,
  maxSize = 50, // 50MB default
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
  multiple = true,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5 text-orange-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    if (acceptedTypes.length > 0) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isAccepted) {
        return `File type ${file.type} is not accepted`;
      }
    }
    
    return null;
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Simulate file upload with progress
    return new Promise((resolve, reject) => {
      const thumbnail = generateThumbnail(file);
      
      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, progress } : f)
        );
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          thumbnail.then(thumb => {
            const uploadedFile: UploadedFile = {
              id: fileId,
              name: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file),
              thumbnail: thumb,
              uploadedAt: new Date(),
              status: 'completed',
              progress: 100
            };
            resolve(uploadedFile);
          });
        }
      }, 200);
    });
  };

  const handleFiles = async (files: FileList) => {
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    // Validate and prepare files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const thumbnail = await generateThumbnail(file);
      
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        thumbnail,
        uploadedAt: new Date(),
        status: 'uploading',
        progress: 0
      };

      newFiles.push(newFile);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files
    try {
      const uploadedFiles = await Promise.all(
        newFiles.map(async (file) => {
          try {
            return await uploadFile(files[newFiles.indexOf(file)]);
          } catch (error) {
            return { ...file, status: 'error' as const };
          }
        })
      );

      setUploadedFiles(prev => 
        prev.map(f => {
          const uploaded = uploadedFiles.find(uf => uf.id === f.id);
          return uploaded || f;
        })
      );

      const successfulUploads = uploadedFiles.filter(f => f.status === 'completed');
      onFilesUploaded(successfulUploads);
      
      toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('File removed');
  };

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Drop files here or click to upload</h3>
              <p className="text-sm text-gray-500 mt-1">
                Max {maxFiles} files, {maxSize}MB each
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Browse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uploaded Files ({uploadedFiles.length})</CardTitle>
            <CardDescription>
              Manage your uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {file.thumbnail ? (
                      <img 
                        src={file.thumbnail} 
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'}>
                        {file.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.type}</span>
                      <span>{file.uploadedAt.toLocaleTimeString()}</span>
                    </div>
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {file.status === 'completed' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;