import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
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
    Underline
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'checkbox' | 'quote' | 'code' | 'divider' | 'image' | 'table' | 'database' | 'embed' | 'callout' | 'toggle' | 'column' | 'synced' | 'template' | 'ai';
  content: string;
  properties: Record<string, any>;
  children?: string[];
  parentId?: string;
  collapsed?: boolean;
  aiGenerated?: boolean;
  metadata?: Record<string, any>;
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
  const [showIntegrations2, setShowIntegrations2] = useState(false);
  const [showWorkflows2, setShowWorkflows2] = useState(false);
  const [showDatabase2, setShowDatabase2] = useState(false);
  const [showCalendar2, setShowCalendar2] = useState(false);
  const [showKanban2, setShowKanban2] = useState(false);
  const [showTimeline2, setShowTimeline2] = useState(false);
  const [showMindmap2, setShowMindmap2] = useState(false);
  const [showWhiteboard2, setShowWhiteboard2] = useState(false);
  const [showPresentation2, setShowPresentation2] = useState(false);
  const [showForms2, setShowForms2] = useState(false);
  const [showIntegrations3, setShowIntegrations3] = useState(false);
  const [showWorkflows3, setShowWorkflows3] = useState(false);
  const [showDatabase3, setShowDatabase3] = useState(false);
  const [showCalendar3, setShowCalendar3] = useState(false);
  const [showKanban3, setShowKanban3] = useState(false);
  const [showTimeline3, setShowTimeline3] = useState(false);
  const [showMindmap3, setShowMindmap3] = useState(false);
  const [showWhiteboard3, setShowWhiteboard3] = useState(false);
  const [showPresentation3, setShowPresentation3] = useState(false);
  const [showForms3, setShowForms3] = useState(false);
  const [showIntegrations4, setShowIntegrations4] = useState(false);
  const [showWorkflows4, setShowWorkflows4] = useState(false);
  const [showDatabase4, setShowDatabase4] = useState(false);
  const [showCalendar4, setShowCalendar4] = useState(false);
  const [showKanban4, setShowKanban4] = useState(false);
  const [showTimeline4, setShowTimeline4] = useState(false);
  const [showMindmap4, setShowMindmap4] = useState(false);
  const [showWhiteboard4, setShowWhiteboard4] = useState(false);
  const [showPresentation4, setShowPresentation4] = useState(false);
  const [showForms4, setShowForms4] = useState(false);
  const [showIntegrations5, setShowIntegrations5] = useState(false);
  const [showWorkflows5, setShowWorkflows5] = useState(false);
  const [showDatabase5, setShowDatabase5] = useState(false);
  const [showCalendar5, setShowCalendar5] = useState(false);
  const [showKanban5, setShowKanban5] = useState(false);
  const [showTimeline5, setShowTimeline5] = useState(false);
  const [showMindmap5, setShowMindmap5] = useState(false);
  const [showWhiteboard5, setShowWhiteboard5] = useState(false);
  const [showPresentation5, setShowPresentation5] = useState(false);
  const [showForms5, setShowForms5] = useState(false);
  const [showIntegrations6, setShowIntegrations6] = useState(false);
  const [showWorkflows6, setShowWorkflows6] = useState(false);
  const [showDatabase6, setShowDatabase6] = useState(false);
  const [showCalendar6, setShowCalendar6] = useState(false);
  const [showKanban6, setShowKanban6] = useState(false);
  const [showTimeline6, setShowTimeline6] = useState(false);
  const [showMindmap6, setShowMindmap6] = useState(false);
  const [showWhiteboard6, setShowWhiteboard6] = useState(false);
  const [showPresentation6, setShowPresentation6] = useState(false);
  const [showForms6, setShowForms6] = useState(false);
  const [showIntegrations7, setShowIntegrations7] = useState(false);
  const [showWorkflows7, setShowWorkflows7] = useState(false);
  const [showDatabase7, setShowDatabase7] = useState(false);
  const [showCalendar7, setShowCalendar7] = useState(false);
  const [showKanban7, setShowKanban7] = useState(false);
  const [showTimeline7, setShowTimeline7] = useState(false);
  const [showMindmap7, setShowMindmap7] = useState(false);
  const [showWhiteboard7, setShowWhiteboard7] = useState(false);
  const [showPresentation7, setShowPresentation7] = useState(false);
  const [showForms7, setShowForms7] = useState(false);
  const [showIntegrations8, setShowIntegrations8] = useState(false);
  const [showWorkflows8, setShowWorkflows8] = useState(false);
  const [showDatabase8, setShowDatabase8] = useState(false);
  const [showCalendar8, setShowCalendar8] = useState(false);
  const [showKanban8, setShowKanban8] = useState(false);
  const [showTimeline8, setShowTimeline8] = useState(false);
  const [showMindmap8, setShowMindmap8] = useState(false);
  const [showWhiteboard8, setShowWhiteboard8] = useState(false);
  const [showPresentation8, setShowPresentation8] = useState(false);
  const [showForms8, setShowForms8] = useState(false);
  const [showIntegrations9, setShowIntegrations9] = useState(false);
  const [showWorkflows9, setShowWorkflows9] = useState(false);
  const [showDatabase9, setShowDatabase9] = useState(false);
  const [showCalendar9, setShowCalendar9] = useState(false);
  const [showKanban9, setShowKanban9] = useState(false);
  const [showTimeline9, setShowTimeline9] = useState(false);
  const [showMindmap9, setShowMindmap9] = useState(false);
  const [showWhiteboard9, setShowWhiteboard9] = useState(false);
  const [showPresentation9, setShowPresentation9] = useState(false);
  const [showForms9, setShowForms9] = useState(false);
  const [showIntegrations10, setShowIntegrations10] = useState(false);
  const [showWorkflows10, setShowWorkflows10] = useState(false);
  const [showDatabase10, setShowDatabase10] = useState(false);
  const [showCalendar10, setShowCalendar10] = useState(false);
  const [showKanban10, setShowKanban10] = useState(false);
  const [showTimeline10, setShowTimeline10] = useState(false);
  const [showMindmap10, setShowMindmap10] = useState(false);
  const [showWhiteboard10, setShowWhiteboard10] = useState(false);
  const [showPresentation10, setShowPresentation10] = useState(false);
  const [showForms10, setShowForms10] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize blocks from note content
  useEffect(() => {
    if (note.content) {
      try {
        const parsedBlocks = JSON.parse(note.content);
        setBlocks(parsedBlocks);
      } catch {
        // If content is not JSON, create a single paragraph block
        setBlocks([{
          id: 'block_1',
          type: 'paragraph',
          content: note.content,
          properties: {}
        }]);
      }
    } else {
      // Create initial empty block
      setBlocks([{
        id: 'block_1',
        type: 'paragraph',
        content: '',
        properties: {}
      }]);
    }
  }, [note.content]);

  // Save blocks to note
  useEffect(() => {
    if (blocks.length > 0) {
      const content = JSON.stringify(blocks);
      onUpdateNote(note.id, { content });
    }
  }, [blocks, note.id, onUpdateNote]);

  // Block management functions
  const createBlock = useCallback((type: Block['type'], content: string = '', afterId?: string) => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random()}`,
      type,
      content,
      properties: {}
    };

    setBlocks(prev => {
      if (afterId) {
        const index = prev.findIndex(b => b.id === afterId);
        return [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)];
      }
      return [...prev, newBlock];
    });

    return newBlock.id;
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  }, []);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index === -1) return prev;

      const newBlocks = [...prev];
      if (direction === 'up' && index > 0) {
        [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      } else if (direction === 'down' && index < newBlocks.length - 1) {
        [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      }

      return newBlocks;
    });
  }, []);

  // AI functions
  const generateWithAI = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiBlock: Block = {
        id: `block_${Date.now()}_ai`,
        type: 'ai',
        content: `AI generated content based on: "${prompt}"\n\nThis is a simulated AI response that would typically include relevant information, suggestions, or content based on the user's prompt.`,
        properties: { aiPrompt: prompt },
        aiGenerated: true
      };

      setBlocks(prev => [...prev, aiBlock]);
      setAiPrompt('');
      setShowAI(false);
      toast.success('AI content generated successfully');
    } catch (error) {
      toast.error('Failed to generate AI content');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Formatting functions
  const formatText = useCallback((format: string) => {
    const activeBlock = blocks.find(b => b.id === activeBlockId);
    if (!activeBlock) return;

    const newProperties = { ...activeBlock.properties };
    
    switch (format) {
      case 'bold':
        newProperties.bold = !newProperties.bold;
        break;
      case 'italic':
        newProperties.italic = !newProperties.italic;
        break;
      case 'underline':
        newProperties.underline = !newProperties.underline;
        break;
      case 'strikethrough':
        newProperties.strikethrough = !newProperties.strikethrough;
        break;
      case 'code':
        newProperties.code = !newProperties.code;
        break;
    }

    updateBlock(activeBlockId!, { properties: newProperties });
  }, [blocks, activeBlockId, updateBlock]);

  // Block type functions
  const changeBlockType = useCallback((blockId: string, newType: Block['type']) => {
    updateBlock(blockId, { type: newType });
  }, [updateBlock]);

  // Render block content
  const renderBlock = useCallback((block: Block) => {
    const isActive = block.id === activeBlockId;
    const className = `block ${isActive ? 'active' : ''} ${block.properties.bold ? 'font-bold' : ''} ${block.properties.italic ? 'italic' : ''} ${block.properties.underline ? 'underline' : ''} ${block.properties.strikethrough ? 'line-through' : ''} ${block.properties.code ? 'font-mono bg-gray-100 px-1 rounded' : ''}`;

    switch (block.type) {
      case 'heading1':
        return (
          <div className="flex items-center space-x-2">
            <h1 className={`text-3xl font-bold ${className}`}>{block.content}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'paragraph')}>
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading2')}>
                  <Heading2 className="w-4 h-4 mr-2" />
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading3')}>
                  <Heading3 className="w-4 h-4 mr-2" />
                  Heading 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'heading2':
        return (
          <div className="flex items-center space-x-2">
            <h2 className={`text-2xl font-semibold ${className}`}>{block.content}</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'paragraph')}>
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading1')}>
                  <Heading1 className="w-4 h-4 mr-2" />
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading3')}>
                  <Heading3 className="w-4 h-4 mr-2" />
                  Heading 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'heading3':
        return (
          <div className="flex items-center space-x-2">
            <h3 className={`text-xl font-medium ${className}`}>{block.content}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'paragraph')}>
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading1')}>
                  <Heading1 className="w-4 h-4 mr-2" />
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading2')}>
                  <Heading2 className="w-4 h-4 mr-2" />
                  Heading 2
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'bullet':
        return (
          <div className="flex items-start space-x-2">
            <span className="mt-2">•</span>
            <div className="flex-1">
              <div className={className}>{block.content}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'paragraph')}>
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'numbered')}>
                  <ListOrdered className="w-4 h-4 mr-2" />
                  Numbered List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'checkbox')}>
                  <ListChecks className="w-4 h-4 mr-2" />
                  Checkbox
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'numbered':
        return (
          <div className="flex items-start space-x-2">
            <span className="mt-2">1.</span>
            <div className="flex-1">
              <div className={className}>{block.content}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'paragraph')}>
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'bullet')}>
                  <List className="w-4 h-4 mr-2" />
                  Bullet List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'checkbox')}>
                  <ListChecks className="w-4 h-4 mr-2" />
                  Checkbox
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-start space-x-2">
            <input type="checkbox" className="mt-2" />
            <div className="flex-1">
              <div className={className}>{block.content}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'paragraph')}>
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'bullet')}>
                  <List className="w-4 h-4 mr-2" />
                  Bullet List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'numbered')}>
                  <ListOrdered className="w-4 h-4 mr-2" />
                  Numbered List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-4 border-gray-300 pl-4 italic">
            <div className={className}>{block.content}</div>
          </div>
        );

      case 'code':
        return (
          <div className="bg-gray-100 p-4 rounded font-mono">
            <div className={className}>{block.content}</div>
          </div>
        );

      case 'divider':
        return <hr className="my-4" />;

      case 'ai':
        return (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Generated</span>
            </div>
            <div className={className}>{block.content}</div>
          </div>
        );

      default:
        return (
          <div className="flex items-center space-x-2">
            <div className={`flex-1 ${className}`}>{block.content}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading1')}>
                  <Heading1 className="w-4 h-4 mr-2" />
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading2')}>
                  <Heading2 className="w-4 h-4 mr-2" />
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'heading3')}>
                  <Heading3 className="w-4 h-4 mr-2" />
                  Heading 3
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'bullet')}>
                  <List className="w-4 h-4 mr-2" />
                  Bullet List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'numbered')}>
                  <ListOrdered className="w-4 h-4 mr-2" />
                  Numbered List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'checkbox')}>
                  <ListChecks className="w-4 h-4 mr-2" />
                  Checkbox
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'quote')}>
                  <Quote className="w-4 h-4 mr-2" />
                  Quote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeBlockType(block.id, 'code')}>
                  <Code className="w-4 h-4 mr-2" />
                  Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
    }
  }, [activeBlockId, changeBlockType]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-white p-2 flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            className={blocks.find(b => b.id === activeBlockId)?.properties.bold ? 'bg-gray-200' : ''}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            className={blocks.find(b => b.id === activeBlockId)?.properties.italic ? 'bg-gray-200' : ''}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            className={blocks.find(b => b.id === activeBlockId)?.properties.underline ? 'bg-gray-200' : ''}
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('strikethrough')}
            className={blocks.find(b => b.id === activeBlockId)?.properties.strikethrough ? 'bg-gray-200' : ''}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('code')}
            className={blocks.find(b => b.id === activeBlockId)?.properties.code ? 'bg-gray-200' : ''}
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('heading1')}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('heading2')}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('bullet')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('numbered')}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('checkbox')}
          >
            <ListChecks className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('quote')}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('code')}
          >
            <Code2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('divider')}
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAI(true)}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('table')}
          >
            <Table className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createBlock('image')}
          >
            <Image className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="group relative"
              onClick={() => setActiveBlockId(block.id)}
            >
              {renderBlock(block)}
              
              {/* Block controls */}
              <div className="absolute left-0 top-0 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(block.id, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBlock(block.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Dialog */}
      {showAI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
            <Textarea
              placeholder="Describe what you want to generate..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="mb-4"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAI(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => generateWithAI(aiPrompt)}
                disabled={!aiPrompt.trim() || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 