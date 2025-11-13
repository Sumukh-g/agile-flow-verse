import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Copy,
    Download,
    Grid,
    Image,
    List,
    MoreHorizontal,
    Search,
    Share2,
    Star,
    Trash2,
    Upload
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

interface GalleryImage {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  size: number;
  type: string;
  uploadedAt: Date;
  tags: string[];
  isStarred: boolean;
  isPublic: boolean;
  author: string;
  description?: string;
  width: number;
  height: number;
}

interface ImageGalleryProps {
  onImagesUploaded: (images: GalleryImage[]) => void;
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  onImagesUploaded,
  className = ''
}) => {
  const [images, setImages] = useState<GalleryImage[]>([
    {
      id: '1',
      name: 'project-screenshot.png',
      url: '/api/placeholder/800/600',
      thumbnail: '/api/placeholder/200/150',
      size: 1024000,
      type: 'image/png',
      uploadedAt: new Date('2024-01-15'),
      tags: ['screenshot', 'project'],
      isStarred: true,
      isPublic: false,
      author: 'John Doe',
      description: 'Main project dashboard screenshot',
      width: 800,
      height: 600
    },
    {
      id: '2',
      name: 'team-photo.jpg',
      url: '/api/placeholder/600/400',
      thumbnail: '/api/placeholder/150/100',
      size: 2048000,
      type: 'image/jpeg',
      uploadedAt: new Date('2024-01-10'),
      tags: ['team', 'photo'],
      isStarred: false,
      isPublic: true,
      author: 'Jane Smith',
      description: 'Team meeting photo',
      width: 600,
      height: 400
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTags = Array.from(new Set(images.flatMap(img => img.tags)));

  const filteredImages = images.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTag === 'all' || image.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    const newImages: GalleryImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Create thumbnail
      const thumbnail = await createThumbnail(file);
      
      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      
      const newImage: GalleryImage = {
        id: imageId,
        name: file.name,
        url: URL.createObjectURL(file),
        thumbnail,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        tags: [],
        isStarred: false,
        isPublic: false,
        author: 'Current User',
        width: dimensions.width,
        height: dimensions.height
      };

      newImages.push(newImage);
    }

    setImages(prev => [...prev, ...newImages]);
    onImagesUploaded(newImages);
    setIsUploading(false);
    toast.success(`${newImages.length} image(s) uploaded successfully`);
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate thumbnail dimensions
          const maxSize = 200;
          let { width, height } = img;
          
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageClick = (image: GalleryImage) => {
    setPreviewImage(image);
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedImages.length === 0) {
      toast.error('No images selected');
      return;
    }

    switch (action) {
      case 'star':
        setImages(prev => prev.map(img => 
          selectedImages.includes(img.id) ? { ...img, isStarred: !img.isStarred } : img
        ));
        toast.success(`${selectedImages.length} image(s) starred`);
        break;
      case 'delete':
        setImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
        setSelectedImages([]);
        toast.success(`${selectedImages.length} image(s) deleted`);
        break;
      case 'download':
        selectedImages.forEach(imageId => {
          const image = images.find(img => img.id === imageId);
          if (image) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = image.name;
            link.click();
          }
        });
        toast.success(`${selectedImages.length} image(s) downloaded`);
        break;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyImageUrl = (image: GalleryImage) => {
    navigator.clipboard.writeText(image.url);
    toast.success('Image URL copied to clipboard');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Image Gallery</h3>
          <p className="text-muted-foreground">Upload and manage your images</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        <div className="flex items-center space-x-1">
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

      {/* Bulk Actions */}
      {selectedImages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedImages.length} image(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={() => handleBulkAction('star')}>
                  <Star className="h-4 w-4 mr-2" />
                  Star
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('download')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedImages([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredImages.map((image) => (
            <Card 
              key={image.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedImages.includes(image.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleImageClick(image)}
            >
              <CardContent className="p-2">
                <div className="relative">
                  <img
                    src={image.thumbnail}
                    alt={image.name}
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {image.isStarred && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                    {image.isPublic && (
                      <Share2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleImageSelect(image.id);
                      }}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium truncate">{image.name}</p>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>{image.width}×{image.height}</span>
                    <span>•</span>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                  {image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {image.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {image.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{image.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredImages.map((image) => (
            <Card 
              key={image.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedImages.includes(image.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleImageClick(image)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleImageSelect(image.id);
                    }}
                    className="h-4 w-4"
                  />
                  <img
                    src={image.thumbnail}
                    alt={image.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium truncate">{image.name}</p>
                      {image.isStarred && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      {image.isPublic && (
                        <Share2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{image.width}×{image.height}</span>
                      <span>{formatFileSize(image.size)}</span>
                      <span>{image.uploadedAt.toLocaleDateString()}</span>
                      <span>by {image.author}</span>
                    </div>
                    {image.description && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {image.description}
                      </p>
                    )}
                    {image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {image.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      copyImageUrl(image);
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = image.url;
                      link.download = image.name;
                      link.click();
                    }}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setImages(prev => 
                          prev.map(img => img.id === image.id ? { ...img, isStarred: !img.isStarred } : img)
                        )}>
                          <Star className="h-4 w-4 mr-2" />
                          {image.isStarred ? 'Unstar' : 'Star'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setImages(prev => 
                          prev.map(img => img.id === image.id ? { ...img, isPublic: !img.isPublic } : img)
                        )}>
                          <Share2 className="h-4 w-4 mr-2" />
                          {image.isPublic ? 'Make Private' : 'Make Public'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setImages(prev => prev.filter(img => img.id !== image.id));
                          toast.success('Image deleted');
                        }}>
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

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewImage.url}
                  alt={previewImage.name}
                  className="w-full h-auto max-h-96 object-contain rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Dimensions</p>
                  <p className="text-gray-600">{previewImage.width} × {previewImage.height}</p>
                </div>
                <div>
                  <p className="font-medium">File Size</p>
                  <p className="text-gray-600">{formatFileSize(previewImage.size)}</p>
                </div>
                <div>
                  <p className="font-medium">Uploaded</p>
                  <p className="text-gray-600">{previewImage.uploadedAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium">Author</p>
                  <p className="text-gray-600">{previewImage.author}</p>
                </div>
              </div>
              {previewImage.description && (
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-gray-600">{previewImage.description}</p>
                </div>
              )}
              {previewImage.tags.length > 0 && (
                <div>
                  <p className="font-medium">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewImage.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGallery;