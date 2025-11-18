import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Bold,
    Brain,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    Link,
    List,
    ListOrdered,
    Moon,
    MoreHorizontal,
    Palette,
    Plus,
    Quote,
    Search,
    Strikethrough,
    Sun,
    Table,
    Underline
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface NotionPage {
  id: string;
  title: string;
  content: string;
  type: string;
  parentId?: string;
  children?: string[];
  isStarred?: boolean;
  isShared?: boolean;
  isPublic?: boolean;
  collaborators?: string[];
  lastEdited?: Date;
  color?: string;
  properties?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface NotionEditorProps {
  page: NotionPage;
  onUpdatePage: (pageId: string, updates: Partial<NotionPage>) => void;
}

const NotionEditor: React.FC<NotionEditorProps> = ({ page, onUpdatePage }) => {
  const [content, setContent] = useState(page.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef<string>('');
  const isUserTypingRef = useRef(false);
  const lastPageContentRef = useRef<string>('');

  // Initialize content from page
  useEffect(() => {
    if (editorRef.current && !content) {
      editorRef.current.innerHTML = page.content || '';
      setContent(page.content || '');
      lastPageContentRef.current = page.content || '';
    }
  }, [page.id]);

  // Sync content to editor when page changes externally (but not when user is typing)
  useEffect(() => {
    if (editorRef.current && !isUserTypingRef.current) {
      const currentContent = editorRef.current.innerHTML;
      // Only update if page content changed externally and differs from current
      if (page.content !== lastPageContentRef.current && page.content !== currentContent) {
        editorRef.current.innerHTML = page.content || '';
        setContent(page.content || '');
        lastPageContentRef.current = page.content || '';
      }
    }
  }, [page.content]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      if (content !== lastSavedRef.current) {
        onUpdatePage(page.id, { content });
        lastSavedRef.current = content;
      }
    };

    const timeoutId = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [content, page.id, onUpdatePage]);

  // Handle text selection
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, []);

  // Format text functions
  const formatText = useCallback((format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    
    switch (format) {
      case 'bold':
        span.style.fontWeight = 'bold';
        break;
      case 'italic':
        span.style.fontStyle = 'italic';
        break;
      case 'underline':
        span.style.textDecoration = 'underline';
        break;
      case 'strikethrough':
        span.style.textDecoration = 'line-through';
        break;
      case 'code':
        span.style.fontFamily = 'monospace';
        span.style.backgroundColor = '#f1f5f9';
        span.style.padding = '2px 4px';
        span.style.borderRadius = '4px';
        break;
    }
    
    range.surroundContents(span);
    selection.removeAllRanges();
    setShowToolbar(false);
  }, []);

  // Add block functions
  const addBlock = useCallback((type: string) => {
    const blockElement = document.createElement('div');
    blockElement.className = 'notion-block';
    blockElement.contentEditable = 'true';
    blockElement.setAttribute('data-block-type', type);
    
    switch (type) {
      case 'h1':
        blockElement.innerHTML = '<h1>Heading 1</h1>';
        break;
      case 'h2':
        blockElement.innerHTML = '<h2>Heading 2</h2>';
        break;
      case 'h3':
        blockElement.innerHTML = '<h3>Heading 3</h3>';
        break;
      case 'bullet':
        blockElement.innerHTML = '<ul><li>Bullet point</li></ul>';
        break;
      case 'numbered':
        blockElement.innerHTML = '<ol><li>Numbered item</li></ol>';
        break;
      case 'quote':
        blockElement.innerHTML = '<blockquote>Quote</blockquote>';
        break;
      case 'code':
        blockElement.innerHTML = '<pre><code>Code block</code></pre>';
        break;
      case 'table':
        blockElement.innerHTML = `
          <table>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
            <tr><td>Cell 3</td><td>Cell 4</td></tr>
          </table>
        `;
        break;
      default:
        blockElement.innerHTML = '<p>New paragraph</p>';
    }
    
    if (editorRef.current) {
      editorRef.current.appendChild(blockElement);
      blockElement.focus();
    }
  }, []);

  // Search functionality
  const searchInContent = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    const text = editorRef.current?.innerText || '';
    const regex = new RegExp(searchQuery, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
      toast.success(`Found ${matches.length} matches`);
    } else {
      toast.info('No matches found');
    }
  }, [searchQuery]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 's':
          e.preventDefault();
          formatText('strikethrough');
          break;
        case 'f':
          e.preventDefault();
          setShowSearch(true);
          break;
        case 'k':
          e.preventDefault();
          // Add link functionality
          break;
      }
    }
  }, [formatText]);

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white'}`}>
      {/* Floating Toolbar */}
      {showToolbar && selectedText && (
        <div className="fixed z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('code')}
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('link')}
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="border-b p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Block Type Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add block
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => addBlock('h1')}>
                  <Heading1 className="h-4 w-4 mr-2" />
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('h2')}>
                  <Heading2 className="h-4 w-4 mr-2" />
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('h3')}>
                  <Heading3 className="h-4 w-4 mr-2" />
                  Heading 3
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('bullet')}>
                  <List className="h-4 w-4 mr-2" />
                  Bullet list
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('numbered')}>
                  <ListOrdered className="h-4 w-4 mr-2" />
                  Numbered list
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('quote')}>
                  <Quote className="h-4 w-4 mr-2" />
                  Quote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('code')}>
                  <Code className="h-4 w-4 mr-2" />
                  Code block
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('table')}>
                  <Table className="h-4 w-4 mr-2" />
                  Table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Formatting */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => formatText('bold')}
                className="h-8 w-8 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => formatText('italic')}
                className="h-8 w-8 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => formatText('underline')}
                className="h-8 w-8 p-0"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => formatText('strikethrough')}
                className="h-8 w-8 p-0"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            {showSearch && (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search in page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  onKeyDown={(e) => e.key === 'Enter' && searchInContent()}
                />
                <Button size="sm" onClick={searchInContent}>
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(false)}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Assistant
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Palette className="h-4 w-4 mr-2" />
                  Customize
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div
            ref={editorRef}
            className="min-h-full outline-none"
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={(e) => {
              isUserTypingRef.current = true;
              const newContent = e.currentTarget.innerHTML;
              setContent(newContent);
              // Reset flag after a short delay to allow external updates
              setTimeout(() => {
                isUserTypingRef.current = false;
              }, 100);
            }}
            onSelect={handleSelection}
            onKeyDown={handleKeyDown}
            style={{
              lineHeight: '1.6',
              fontSize: '16px'
            }}
          />
          
          {/* Empty state */}
          {!content && (
            <div className="text-gray-400 text-center py-8">
              <p>Type '/' for commands or start typing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t p-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Last saved: {new Date().toLocaleTimeString()}</span>
          <span>{content.length} characters</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Auto-save enabled</Badge>
        </div>
      </div>
    </div>
  );
};

export default NotionEditor; 