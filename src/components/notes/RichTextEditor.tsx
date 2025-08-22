import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Bold,
    Code,
    Code2,
    Heading1,
    Heading2,
    Heading3,
    Image,
    Italic,
    List,
    ListChecks,
    ListOrdered,
    MoreHorizontal,
    Quote,
    Sparkles,
    Strikethrough,
    Table,
    Trash2,
    Type,
    Underline,
    Mic,
    MicOff,
    Paperclip,
    Video,
    Link,
    Tag,
    Star,
    Pin,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Search,
    History,
    Users,
    Palette,
    Download,
    Upload,
    FileText,
    Calendar,
    Clock,
    Target,
    CheckCircle,
    Brain,
    Zap,
    Merge,
    Copy,
    Share,
    Archive,
    Trash,
    Plus,
    Minus,
    RotateCcw,
    Save,
    Edit,
    Eye,
    EyeOff,
    Settings,
    Moon,
    Sun,
    Monitor
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'checkbox' | 'quote' | 'code' | 'divider' | 'image' | 'table' | 'database' | 'embed' | 'callout' | 'toggle' | 'column' | 'synced' | 'template' | 'ai' | 'audio' | 'video' | 'file' | 'drawing';
  content: string;
  properties: Record<string, any>;
  children?: string[];
  parentId?: string;
  collapsed?: boolean;
  aiGenerated?: boolean;
  metadata?: Record<string, any>;
  attachments?: Attachment[];
  audioUrl?: string;
  videoUrl?: string;
  drawingData?: string;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'pdf' | 'code' | 'table' | 'link' | 'bookmark';
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

interface RichTextEditorProps {
  note: any;
  onUpdateNote: (noteId: string, updates: any) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ note, onUpdateNote }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [grammarCheckEnabled, setGrammarCheckEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingContext, setDrawingContext] = useState<CanvasRenderingContext2D | null>(null);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [brushSize, setBrushSize] = useState(2);
  const [brushColor, setBrushColor] = useState('#000000');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize blocks from note content
  useEffect(() => {
    if (note?.content) {
      try {
        const parsedBlocks = JSON.parse(note.content);
        setBlocks(parsedBlocks);
      } catch {
        // If content is not JSON, treat as plain text
        setBlocks([{
          id: '1',
          type: 'paragraph',
          content: note.content,
          properties: {},
          metadata: {}
        }]);
      }
    } else {
      setBlocks([{
        id: '1',
        type: 'paragraph',
        content: '',
        properties: {},
        metadata: {}
      }]);
    }
  }, [note]);

  // Save blocks to note
  useEffect(() => {
    if (blocks.length > 0) {
      const content = JSON.stringify(blocks);
      onUpdateNote(note.id, { content, wordCount: calculateWordCount(), readingTime: calculateReadingTime() });
    }
  }, [blocks, note.id, onUpdateNote]);

  // Initialize markdown content
  useEffect(() => {
    setMarkdownContent(blocksToMarkdown(blocks));
  }, [blocks]);

  // Audio recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        addAudioBlock(url);
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const addAudioBlock = (audioUrl: string) => {
    const newBlock: Block = {
      id: `audio_${Date.now()}`,
      type: 'audio',
      content: 'Audio Recording',
      properties: {},
      metadata: { audioUrl },
      audioUrl
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  // File attachment functionality
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const attachment: Attachment = {
            id: `file_${Date.now()}`,
            name: file.name,
            type: getFileType(file.type),
            url: e.target?.result as string,
            size: file.size,
            uploadedAt: new Date(),
            uploadedBy: 'Current User'
          };
          addAttachmentBlock(attachment);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const getFileType = (mimeType: string): Attachment['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'document';
    return 'document';
  };

  const addAttachmentBlock = (attachment: Attachment) => {
    const newBlock: Block = {
      id: `attachment_${Date.now()}`,
      type: 'file',
      content: attachment.name,
      properties: {},
      metadata: { attachment },
      attachments: [attachment]
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  // Drawing functionality
  const initializeCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setDrawingContext(ctx);
      setCanvasRef(canvas);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingContext || !canvasRef) return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setLastX(x);
    setLastY(y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingContext || !canvasRef) return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingContext.strokeStyle = brushColor;
    drawingContext.lineWidth = brushSize;
    drawingContext.beginPath();
    drawingContext.moveTo(lastX, lastY);
    drawingContext.lineTo(x, y);
    drawingContext.stroke();
    
    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const saveDrawing = () => {
    if (canvasRef) {
      const dataUrl = canvasRef.toDataURL();
      const newBlock: Block = {
        id: `drawing_${Date.now()}`,
        type: 'drawing',
        content: 'Drawing',
        properties: {},
        metadata: { drawingData: dataUrl },
        drawingData: dataUrl
      };
      setBlocks(prev => [...prev, newBlock]);
      setShowDrawing(false);
      setDrawingMode(false);
    }
  };

  // Text formatting functions
  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
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
      }
      
      range.surroundContents(span);
      selection.removeAllRanges();
    }
  };

  // Markdown conversion
  const blocksToMarkdown = (blocks: Block[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'heading1':
          return `# ${block.content}\n\n`;
        case 'heading2':
          return `## ${block.content}\n\n`;
        case 'heading3':
          return `### ${block.content}\n\n`;
        case 'bullet':
          return `- ${block.content}\n`;
        case 'numbered':
          return `1. ${block.content}\n`;
        case 'quote':
          return `> ${block.content}\n\n`;
        case 'code':
          return `\`\`\`\n${block.content}\n\`\`\`\n\n`;
        default:
          return `${block.content}\n\n`;
      }
    }).join('');
  };

  const markdownToBlocks = (markdown: string): Block[] => {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let currentBlock: Block | null = null;

    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: `block_${index}`,
          type: 'heading1',
          content: line.substring(2),
          properties: {},
          metadata: {}
        };
      } else if (line.startsWith('## ')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: `block_${index}`,
          type: 'heading2',
          content: line.substring(3),
          properties: {},
          metadata: {}
        };
      } else if (line.startsWith('### ')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: `block_${index}`,
          type: 'heading3',
          content: line.substring(4),
          properties: {},
          metadata: {}
        };
      } else if (line.startsWith('- ')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: `block_${index}`,
          type: 'bullet',
          content: line.substring(2),
          properties: {},
          metadata: {}
        };
      } else if (line.startsWith('1. ')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: `block_${index}`,
          type: 'numbered',
          content: line.substring(3),
          properties: {},
          metadata: {}
        };
      } else if (line.startsWith('> ')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: `block_${index}`,
          type: 'quote',
          content: line.substring(2),
          properties: {},
          metadata: {}
        };
      } else if (line.trim() === '') {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
      } else {
        if (!currentBlock) {
          currentBlock = {
            id: `block_${index}`,
            type: 'paragraph',
            content: line,
            properties: {},
            metadata: {}
          };
        } else {
          currentBlock.content += '\n' + line;
        }
      }
    });

    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  };

  // Utility functions
  const calculateWordCount = (): number => {
    return blocks.reduce((count, block) => {
      return count + block.content.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
  };

  const calculateReadingTime = (): number => {
    const wordCount = calculateWordCount();
    return Math.ceil(wordCount / 200); // Average reading speed
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      content: '',
      properties: {},
      metadata: {}
    };
    setBlocks(prev => [...prev, newBlock]);
    setActiveBlockId(newBlock.id);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  };

  // AI functionality
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiBlock: Block = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `AI Generated content based on: "${aiPrompt}"\n\nThis is a placeholder for AI-generated content. In a real implementation, this would call an AI API to generate relevant content based on the prompt.`,
        properties: {},
        metadata: { prompt: aiPrompt, generatedAt: new Date() },
        aiGenerated: true
      };
      
      setBlocks(prev => [...prev, aiBlock]);
      setAiPrompt('');
      toast.success('AI content generated');
    } catch (error) {
      toast.error('Failed to generate AI content');
    } finally {
      setIsGenerating(false);
    }
  };

  // Spell check functionality
  const checkSpelling = (text: string): string[] => {
    // Simple spell check implementation
    const words = text.split(/\s+/);
    const misspelled: string[] = [];
    
    // This is a basic implementation - in production, you'd use a proper spell check library
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length > 2 && !commonWords.includes(cleanWord)) {
        // Simple heuristic - words with unusual letter combinations
        if (cleanWord.includes('xx') || cleanWord.includes('zz') || cleanWord.includes('qq')) {
          misspelled.push(word);
        }
      }
    });
    
    return misspelled;
  };

  // Tag management
  const addTag = () => {
    if (newTag.trim() && !note.tags?.includes(newTag.trim())) {
      const updatedTags = [...(note.tags || []), newTag.trim()];
      onUpdateNote(note.id, { tags: updatedTags });
      setNewTag('');
      toast.success('Tag added');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = note.tags?.filter((tag: string) => tag !== tagToRemove) || [];
    onUpdateNote(note.id, { tags: updatedTags });
    toast.success('Tag removed');
  };

  // Password protection
  const togglePasswordProtection = () => {
    if (isPasswordProtected) {
      setIsPasswordProtected(false);
      onUpdateNote(note.id, { passwordProtected: false, password: null });
      toast.success('Password protection removed');
    } else {
      setShowPasswordDialog(true);
    }
  };

  const setPasswordProtection = () => {
    if (password.trim()) {
      setIsPasswordProtected(true);
      onUpdateNote(note.id, { passwordProtected: true, password: password.trim() });
      setPassword('');
      setShowPasswordDialog(false);
      toast.success('Password protection enabled');
    }
  };

  // Search functionality
  const searchInNote = (query: string) => {
    if (!query.trim()) return [];
    
    const results: { blockId: string; content: string; index: number }[] = [];
    blocks.forEach(block => {
      const index = block.content.toLowerCase().indexOf(query.toLowerCase());
      if (index !== -1) {
        results.push({
          blockId: block.id,
          content: block.content,
          index
        });
      }
    });
    
    return results;
  };

  const searchResults = useMemo(() => searchInNote(searchQuery), [searchQuery, blocks]);

  // Version history
  const saveVersion = () => {
    const version = {
      id: `version_${Date.now()}`,
      content: JSON.stringify(blocks),
      timestamp: new Date(),
      version: currentVersion + 1
    };
    
    setVersionHistory(prev => [...prev, version]);
    setCurrentVersion(prev => prev + 1);
    toast.success('Version saved');
  };

  const restoreVersion = (version: any) => {
    try {
      const restoredBlocks = JSON.parse(version.content);
      setBlocks(restoredBlocks);
      setCurrentVersion(version.version);
      toast.success('Version restored');
    } catch (error) {
      toast.error('Failed to restore version');
    }
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white'}`}>
      {/* Enhanced Toolbar */}
      <div className="border-b p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {/* Text Formatting */}
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
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            {/* Headings */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('heading1')}
              className="h-8 w-8 p-0"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('heading2')}
              className="h-8 w-8 p-0"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('heading3')}
              className="h-8 w-8 p-0"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            {/* Lists */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('bullet')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('numbered')}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('checkbox')}
              className="h-8 w-8 p-0"
            >
              <ListChecks className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            {/* Special Blocks */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('quote')}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('code')}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBlock('table')}
              className="h-8 w-8 p-0"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Media Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-8 w-8 p-0 ${isRecording ? 'bg-red-500 text-white' : ''}`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDrawing(true)}
              className="h-8 w-8 p-0"
            >
              <Palette className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            {/* AI Features */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAI(!showAI)}
              className="h-8 w-8 p-0"
            >
              <Brain className="h-4 w-4" />
            </Button>
            
            {/* Search */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="h-8 w-8 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="h-8 w-8 p-0"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Markdown Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={showMarkdown}
              onCheckedChange={setShowMarkdown}
            />
            <Label>Markdown Mode</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={spellCheckEnabled}
              onCheckedChange={setSpellCheckEnabled}
            />
            <Label>Spell Check</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={grammarCheckEnabled}
              onCheckedChange={setGrammarCheckEnabled}
            />
            <Label>Grammar Check</Label>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAI && (
        <div className="border-b p-4 bg-blue-50 dark:bg-blue-900">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="h-4 w-4" />
            <span className="font-medium">AI Assistant</span>
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="Ask AI to help with your note..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={generateWithAI}
              disabled={isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      )}

      {/* Search Panel */}
      {showSearch && (
        <div className="border-b p-4 bg-yellow-50 dark:bg-yellow-900">
          <div className="flex items-center space-x-2 mb-2">
            <Search className="h-4 w-4" />
            <span className="font-medium">Search in Note</span>
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-gray-500">
              {searchResults.length} results
            </span>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {searchResults.slice(0, 5).map((result, index) => (
                <div
                  key={index}
                  className="p-2 bg-white dark:bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setActiveBlockId(result.blockId)}
                >
                  {result.content.substring(Math.max(0, result.index - 20), result.index + 50)}...
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        <Tabs value={showMarkdown ? "markdown" : "editor"} className="w-full">
          <TabsContent value="editor" className="h-full">
            <div className="h-full overflow-auto p-6">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className={`mb-4 ${
                    activeBlockId === block.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setActiveBlockId(block.id)}
                >
                  {block.type === 'heading1' && (
                    <h1 className="text-3xl font-bold mb-2">{block.content}</h1>
                  )}
                  {block.type === 'heading2' && (
                    <h2 className="text-2xl font-bold mb-2">{block.content}</h2>
                  )}
                  {block.type === 'heading3' && (
                    <h3 className="text-xl font-bold mb-2">{block.content}</h3>
                  )}
                  {block.type === 'bullet' && (
                    <div className="flex items-start space-x-2">
                      <span className="mt-2">•</span>
                      <span>{block.content}</span>
                    </div>
                  )}
                  {block.type === 'numbered' && (
                    <div className="flex items-start space-x-2">
                      <span className="mt-2">1.</span>
                      <span>{block.content}</span>
                    </div>
                  )}
                  {block.type === 'checkbox' && (
                    <div className="flex items-start space-x-2">
                      <input type="checkbox" className="mt-1" />
                      <span>{block.content}</span>
                    </div>
                  )}
                  {block.type === 'quote' && (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic">
                      {block.content}
                    </blockquote>
                  )}
                  {block.type === 'code' && (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-sm overflow-x-auto">
                      <code>{block.content}</code>
                    </pre>
                  )}
                  {block.type === 'audio' && (
                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
                      <div className="flex items-center space-x-2 mb-2">
                        <Mic className="h-4 w-4" />
                        <span className="font-medium">Audio Recording</span>
                      </div>
                      <audio controls className="w-full">
                        <source src={block.audioUrl} type="audio/webm" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  {block.type === 'file' && block.attachments && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                      <div className="flex items-center space-x-2 mb-2">
                        <Paperclip className="h-4 w-4" />
                        <span className="font-medium">Attachment: {block.attachments[0].name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <span className="text-sm text-gray-500">
                          {Math.round(block.attachments[0].size / 1024)} KB
                        </span>
                      </div>
                    </div>
                  )}
                  {block.type === 'drawing' && block.drawingData && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                      <div className="flex items-center space-x-2 mb-2">
                        <Palette className="h-4 w-4" />
                        <span className="font-medium">Drawing</span>
                      </div>
                      <img
                        src={block.drawingData}
                        alt="Drawing"
                        className="max-w-full h-auto border rounded"
                      />
                    </div>
                  )}
                  {block.type === 'ai' && (
                    <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-4 w-4" />
                        <span className="font-medium">AI Generated Content</span>
                        <Badge variant="secondary">AI</Badge>
                      </div>
                      <div className="whitespace-pre-wrap">{block.content}</div>
                    </div>
                  )}
                  {(block.type === 'paragraph' || !block.type) && (
                    <Textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      className="min-h-[100px] resize-none border-0 focus:ring-0 text-base"
                      placeholder="Start typing..."
                      spellCheck={spellCheckEnabled}
                    />
                  )}
                  
                  {/* Block Actions */}
                  <div className="flex items-center space-x-2 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                onClick={() => addBlock('paragraph')}
                variant="outline"
                className="w-full mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Block
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="markdown" className="h-full">
            <div className="h-full flex">
              <div className="w-1/2 p-6 border-r">
                <h3 className="font-medium mb-4">Markdown Editor</h3>
                <Textarea
                  value={markdownContent}
                  onChange={(e) => {
                    setMarkdownContent(e.target.value);
                    setBlocks(markdownToBlocks(e.target.value));
                  }}
                  className="h-full resize-none"
                  placeholder="Write markdown here..."
                />
              </div>
              <div className="w-1/2 p-6">
                <h3 className="font-medium mb-4">Preview</h3>
                <div className="prose max-w-none">
                  {/* Markdown preview would be rendered here */}
                  <pre className="whitespace-pre-wrap">{markdownContent}</pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawing Modal */}
      {showDrawing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[800px] h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Drawing Canvas</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 rounded border"
                />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20"
                />
                <Button size="sm" onClick={() => setShowDrawing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveDrawing}>
                  Save Drawing
                </Button>
              </div>
            </div>
            <canvas
              ref={initializeCanvas}
              width={750}
              height={500}
              className="border rounded bg-white cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>
      )}

      {/* Password Protection Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Set Password Protection</h3>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={setPasswordProtection}>
                Set Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default RichTextEditor; 