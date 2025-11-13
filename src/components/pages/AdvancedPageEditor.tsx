import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Eye,
    FileText,
    Heading1,
    Image,
    Italic,
    Layout,
    List,
    Quote,
    Save,
    Table,
    Trash2,
    Type,
    Underline,
    X
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import ImageGallery from './ImageGallery';

interface PageContent {
  id: string;
  type: 'text' | 'heading' | 'image' | 'table' | 'code' | 'quote' | 'list' | 'divider';
  content: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
  metadata?: {
    level?: number; // for headings
    listType?: 'bullet' | 'numbered';
    language?: string; // for code blocks
    caption?: string; // for images
    alt?: string; // for images
  };
}

interface AdvancedPageEditorProps {
  initialContent?: PageContent[];
  onSave: (content: PageContent[]) => void;
  className?: string;
}

const AdvancedPageEditor: React.FC<AdvancedPageEditorProps> = ({
  initialContent = [],
  onSave,
  className = ''
}) => {
  const [content, setContent] = useState<PageContent[]>(initialContent);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const addBlock = (type: PageContent['type']) => {
    const newBlock: PageContent = {
      id: Date.now().toString(),
      type,
      content: '',
      style: {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        alignment: 'left',
        fontSize: 16
      }
    };

    if (type === 'heading') {
      newBlock.metadata = { level: 1 };
    } else if (type === 'list') {
      newBlock.metadata = { listType: 'bullet' };
    } else if (type === 'code') {
      newBlock.metadata = { language: 'javascript' };
    }

    setContent(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<PageContent>) => {
    setContent(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setContent(prev => prev.filter(block => block.id !== id));
    setSelectedBlock(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = content.findIndex(block => block.id === id);
    if (index === -1) return;

    const newContent = [...content];
    const block = newContent[index];
    newContent.splice(index, 1);
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newContent.splice(newIndex, 0, block);
    
    setContent(newContent);
  };

  const toggleStyle = (style: keyof NonNullable<PageContent['style']>) => {
    if (!selectedBlock) return;
    
    updateBlock(selectedBlock, {
      style: {
        ...content.find(b => b.id === selectedBlock)?.style,
        [style]: !content.find(b => b.id === selectedBlock)?.style?.[style]
      }
    });
  };

  const handleImageUpload = (images: any[]) => {
    images.forEach(image => {
      const newBlock: PageContent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'image',
        content: image.url,
        metadata: {
          caption: image.name,
          alt: image.name
        }
      };
      setContent(prev => [...prev, newBlock]);
    });
    setShowImageGallery(false);
    toast.success('Image(s) added to page');
  };

  const handleFileUpload = (files: any[]) => {
    files.forEach(file => {
      const newBlock: PageContent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'text',
        content: `[File: ${file.name}](${file.url})`,
        style: {
          bold: true,
          color: '#0066cc'
        }
      };
      setContent(prev => [...prev, newBlock]);
    });
    setShowFileUpload(false);
    toast.success('File(s) added to page');
  };

  const renderBlock = (block: PageContent) => {
    const isSelected = selectedBlock === block.id;
    
    const blockStyle = {
      ...block.style,
      textAlign: block.style?.alignment,
      fontSize: block.style?.fontSize ? `${block.style.fontSize}px` : undefined,
      color: block.style?.color,
      backgroundColor: block.style?.backgroundColor
    };

    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.metadata?.level || 1}` as keyof JSX.IntrinsicElements;
        return (
          <div
            key={block.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBlock(block.id)}
          >
            <HeadingTag style={blockStyle} className="m-0">
              {block.content || 'Heading...'}
            </HeadingTag>
          </div>
        );

      case 'text':
        return (
          <div
            key={block.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBlock(block.id)}
          >
            <p style={blockStyle} className="m-0">
              {block.content || 'Type something...'}
            </p>
          </div>
        );

      case 'image':
        return (
          <div
            key={block.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBlock(block.id)}
          >
            <img
              src={block.content}
              alt={block.metadata?.alt || 'Image'}
              className="max-w-full h-auto rounded"
            />
            {block.metadata?.caption && (
              <p className="text-sm text-gray-600 mt-2 text-center">
                {block.metadata.caption}
              </p>
            )}
          </div>
        );

      case 'code':
        return (
          <div
            key={block.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBlock(block.id)}
          >
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              <code>{block.content || '// Code here...'}</code>
            </pre>
          </div>
        );

      case 'quote':
        return (
          <div
            key={block.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBlock(block.id)}
          >
            <blockquote className="border-l-4 border-gray-300 pl-4 italic">
              {block.content || 'Quote...'}
            </blockquote>
          </div>
        );

      case 'list':
        const ListTag = block.metadata?.listType === 'numbered' ? 'ol' : 'ul';
        return (
          <div
            key={block.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBlock(block.id)}
          >
            <ListTag className="m-0">
              <li>{block.content || 'List item...'}</li>
            </ListTag>
          </div>
        );

      case 'divider':
        return (
          <div
            key={block.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedBlock(block.id)}
          >
            <hr className="border-gray-300" />
          </div>
        );

      default:
        return null;
    }
  };

  const handleSave = () => {
    onSave(content);
    toast.success('Page saved successfully');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageGallery(true)}
              >
                <Image className="h-4 w-4 mr-2" />
                Images
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileUpload(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Toolbar */}
      {selectedBlock && !isPreview && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleStyle('bold')}
                className={content.find(b => b.id === selectedBlock)?.style?.bold ? 'bg-gray-200' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleStyle('italic')}
                className={content.find(b => b.id === selectedBlock)?.style?.italic ? 'bg-gray-200' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleStyle('underline')}
                className={content.find(b => b.id === selectedBlock)?.style?.underline ? 'bg-gray-200' : ''}
              >
                <Underline className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBlock(selectedBlock, {
                  style: { ...content.find(b => b.id === selectedBlock)?.style, alignment: 'left' }
                })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBlock(selectedBlock, {
                  style: { ...content.find(b => b.id === selectedBlock)?.style, alignment: 'center' }
                })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBlock(selectedBlock, {
                  style: { ...content.find(b => b.id === selectedBlock)?.style, alignment: 'right' }
                })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <Card>
        <CardContent className="p-6">
          {isPreview ? (
            <div className="prose max-w-none">
              {content.map(block => (
                <div key={block.id}>
                  {block.type === 'heading' && (
                    <h1 className="text-2xl font-bold">{block.content}</h1>
                  )}
                  {block.type === 'text' && (
                    <p>{block.content}</p>
                  )}
                  {block.type === 'image' && (
                    <img src={block.content} alt={block.metadata?.alt} className="max-w-full" />
                  )}
                  {block.type === 'code' && (
                    <pre className="bg-gray-100 p-4 rounded"><code>{block.content}</code></pre>
                  )}
                  {block.type === 'quote' && (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic">
                      {block.content}
                    </blockquote>
                  )}
                  {block.type === 'list' && (
                    <ul><li>{block.content}</li></ul>
                  )}
                  {block.type === 'divider' && (
                    <hr />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {content.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Start building your page by adding content blocks</p>
                </div>
              )}
              
              {content.map(block => (
                <div key={block.id} className="relative group">
                  {renderBlock(block)}
                  {selectedBlock === block.id && (
                    <div className="absolute -left-8 top-0 flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBlock(block.id, 'up')}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBlock(block.id, 'down')}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBlock(block.id)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Content Blocks */}
      {!isPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => addBlock('text')}>
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('heading')}>
                <Heading1 className="h-4 w-4 mr-2" />
                Heading
              </Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('image')}>
                <Image className="h-4 w-4 mr-2" />
                Image
              </Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('code')}>
                <Code className="h-4 w-4 mr-2" />
                Code
              </Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('quote')}>
                <Quote className="h-4 w-4 mr-2" />
                Quote
              </Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('list')}>
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('divider')}>
                <Layout className="h-4 w-4 mr-2" />
                Divider
              </Button>
              <Button variant="outline" size="sm" onClick={() => addBlock('table')}>
                <Table className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Images</h3>
              <Button variant="ghost" onClick={() => setShowImageGallery(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ImageGallery onImagesUploaded={handleImageUpload} />
          </div>
        </div>
      )}

      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Files</h3>
              <Button variant="ghost" onClick={() => setShowFileUpload(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FileUpload onFilesUploaded={handleFileUpload} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedPageEditor;