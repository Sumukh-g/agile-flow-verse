import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bold,
    Brain,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    List,
    ListOrdered,
    MoreHorizontal,
    Plus,
    Quote,
    Search,
    Strikethrough,
    Table,
    Underline,
    BarChart3,
    TrendingUp,
    FileText,
    Calendar,
    Tag,
    Star,
    Pin,
    Trash2,
    Edit,
    Save,
    Moon,
    Sun,
    FileDown,
    Link2,
    Copy,
    Hash
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, noteKeys } from '@/hooks/useNotesEnhanced';

interface ProjectNotesViewProps {
  projectId: string | undefined;
}

const ProjectNotesView: React.FC<ProjectNotesViewProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  // Fetch real notes from API
  const { data: notesData, isLoading: notesLoading, refetch: refetchNotes } = useNotes(projectId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  
  // Backend returns { items: Note[], nextCursor: string | null }
  // The API client should extract items, but handle both cases
  const apiNotes = notesData?.items || notesData?.data || notesData || [];
  const notes = Array.isArray(apiNotes) ? apiNotes : [];
  
  // Debug logging to help diagnose issues
  React.useEffect(() => {
    if (notesData !== undefined) {
      console.log('[ProjectNotesView] Notes data:', {
        notesData,
        apiNotes,
        notesCount: notes.length,
        projectId,
        isLoading: notesLoading
      });
    }
  }, [notesData, apiNotes, notes.length, projectId, notesLoading]);
  
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    // Check if dark mode is already set in localStorage or system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) {
        return stored === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // Apply dark mode to document
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (darkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode]);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isUserTypingRef = useRef(false);
  const lastSavedRef = useRef<string>('');

  // Extract categories from notes - use tags as categories, memoized to prevent infinite loops
  const categories = useMemo(() => {
    if (!notes || notes.length === 0) return ['All Notes'];
    // Extract all tags from notes (excluding special tags like _pinned, _starred)
    const allTags = notes.flatMap((note: any) => {
      const tags = note.tags || [];
      return tags.filter((tag: string) => !tag.startsWith('_'));
    });
    const uniqueTags = Array.from(new Set(allTags));
    // If no tags, return default category
    return uniqueTags.length > 0 ? uniqueTags : ['All Notes'];
  }, [notes]);

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter((note: any) => {
      const matchesSearch = (note.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (note.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (note.tags || []).some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Match category: if "all" or "All Notes", show all; otherwise match by tag
      const noteTags = (note.tags || []).filter((tag: string) => !tag.startsWith('_'));
      let matchesCategory = false;
      if (selectedCategory === "all" || selectedCategory === "All Notes") {
        matchesCategory = true;
      } else if (selectedCategory === "Untagged") {
        matchesCategory = noteTags.length === 0;
      } else {
        matchesCategory = noteTags.includes(selectedCategory);
      }
      
      return matchesSearch && matchesCategory;
    });

    // Sort notes
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'category':
          const tagsA = (a.tags || []).filter((tag: string) => !tag.startsWith('_')).join(', ') || 'Untagged';
          const tagsB = (b.tags || []).filter((tag: string) => !tag.startsWith('_')).join(', ') || 'Untagged';
          comparison = tagsA.localeCompare(tagsB);
          break;
        case 'date':
        default:
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Show pinned/starred notes first
    filtered.sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return 0;
    });

    return filtered;
  }, [notes, searchTerm, selectedCategory, sortBy, sortOrder]);

  // Insights calculations
  const insights = useMemo(() => {
    const totalNotes = notes.length || 0;
    const totalWords = notes.reduce((acc: number, note: any) => {
      try {
        let content = note.content || '';
        // If content is a JSON string, parse it
        if (typeof content === 'string' && content.startsWith('{')) {
          const parsed = JSON.parse(content);
          content = parsed?.html || parsed?.content || content;
        }
        // Remove HTML tags and count words
        const textContent = content.replace(/<[^>]*>/g, ' ').trim();
        const words = textContent.split(/\s+/).filter((w: string) => w.length > 0);
        return acc + words.length;
      } catch {
        // If parsing fails, treat as plain text
        const textContent = (note.content || '').replace(/<[^>]*>/g, ' ').trim();
        const words = textContent.split(/\s+/).filter((w: string) => w.length > 0);
        return acc + words.length;
      }
    }, 0);
    const categoriesCount = categories.length;
    const recentNotes = notes.filter((note: any) => {
      const noteDate = new Date(note.createdAt || note.updatedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return noteDate >= weekAgo;
    }).length;
    
    const categoryDistribution = categories.reduce((acc: Record<string, number>, cat: string) => {
      // Count notes that have this tag (excluding special tags)
      acc[cat] = notes.filter((n: any) => {
        const noteTags = (n.tags || []).filter((tag: string) => !tag.startsWith('_'));
        return noteTags.includes(cat);
      }).length;
      return acc;
    }, {});
    
    // Also add "Untagged" category for notes without tags
    const untaggedCount = notes.filter((n: any) => {
      const noteTags = (n.tags || []).filter((tag: string) => !tag.startsWith('_'));
      return noteTags.length === 0;
    }).length;
    if (untaggedCount > 0) {
      categoryDistribution['Untagged'] = untaggedCount;
    }

    return {
      totalNotes: totalNotes || 0,
      totalWords: totalWords || 0,
      categoriesCount: categoriesCount || 0,
      recentNotes: recentNotes || 0,
      categoryDistribution
    };
  }, [notes, categories]);

  // Load note content when selected
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title || '');
      // Parse JSON content if it's a string, otherwise use as-is
      let parsedContent = '';
      try {
        if (typeof selectedNote.content === 'string') {
          // Check if it's a JSON string
          if (selectedNote.content.trim().startsWith('{')) {
            const parsed = JSON.parse(selectedNote.content);
            // If it's an object with HTML, extract it, otherwise use the string
            parsedContent = parsed?.html || parsed?.content || '';
          } else {
            // It's plain HTML, use as-is
            parsedContent = selectedNote.content;
          }
        } else {
          parsedContent = selectedNote.content || '';
        }
      } catch {
        // If parsing fails, use content as-is (might be plain HTML)
        parsedContent = typeof selectedNote.content === 'string' ? selectedNote.content : '';
      }
      
      // Set content state and editor HTML
      setContent(parsedContent);
      const tags = selectedNote.tags || [];
      setNoteTags(tags);
      // Check for pin/star in tags (using special tag prefixes)
      setIsPinned(tags.includes('_pinned'));
      setIsStarred(tags.includes('_starred'));
      
      // Set editor content after a brief delay to ensure ref is ready
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = parsedContent || '<p><br></p>';
          // Focus the editor
          editorRef.current.focus();
        }
      }, 0);
      
      lastSavedRef.current = parsedContent;
    } else {
      setTitle('');
      setContent('');
      setNoteTags([]);
      setIsPinned(false);
      setIsStarred(false);
      if (editorRef.current) {
        editorRef.current.innerHTML = '<p><br></p>';
      }
      lastSavedRef.current = '';
    }
  }, [selectedNote]);

  // Track editor changes for auto-save
  useEffect(() => {
    if (!editorRef.current || !selectedNote) return;

    const handleInput = () => {
      if (editorRef.current) {
        const htmlContent = editorRef.current.innerHTML;
        setContent(htmlContent);
        isUserTypingRef.current = true;
      }
    };

    const editor = editorRef.current;
    editor.addEventListener('input', handleInput);
    editor.addEventListener('paste', handleInput);

    return () => {
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('paste', handleInput);
    };
  }, [selectedNote]);

  // Auto-save functionality
  useEffect(() => {
    if (!selectedNote || !isUserTypingRef.current) return;
    
    const autoSave = () => {
      const htmlContent = editorRef.current?.innerHTML || '';
      // Only save if content has actually changed
      if (htmlContent !== lastSavedRef.current && htmlContent.trim() !== '') {
        const jsonContent = JSON.stringify({ html: htmlContent, type: 'rich-text' });
        
        updateNote.mutate({
          id: selectedNote.id,
          title,
          content: jsonContent,
          tags: noteTags,
        }, {
          onSuccess: () => {
            lastSavedRef.current = htmlContent;
            isUserTypingRef.current = false;
            // Invalidate queries to refresh sidebar
            queryClient.invalidateQueries({ queryKey: noteKeys.list(projectId) });
            queryClient.refetchQueries({ queryKey: noteKeys.list(projectId) });
          }
        });
      }
    };

    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [content, title, selectedNote, updateNote, noteTags, projectId, queryClient]);

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

    document.execCommand(format, false);
    setShowToolbar(false);
    
    // Update content
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      isUserTypingRef.current = true;
    }
  }, []);

  // Add block functions with escape functionality
  const addBlock = useCallback((type: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Create a wrapper div for the block with escape functionality
    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'mb-2 relative group';
    blockWrapper.setAttribute('data-block-type', type);
    
    let blockContent = '';
    switch (type) {
      case 'h1':
        blockContent = '<h1 class="text-3xl font-bold mb-2" contenteditable="true">Heading 1</h1>';
        break;
      case 'h2':
        blockContent = '<h2 class="text-2xl font-bold mb-2" contenteditable="true">Heading 2</h2>';
        break;
      case 'h3':
        blockContent = '<h3 class="text-xl font-bold mb-2" contenteditable="true">Heading 3</h3>';
        break;
      case 'bullet':
        blockContent = '<ul class="list-disc list-inside ml-4"><li contenteditable="true">Bullet point</li></ul>';
        break;
      case 'numbered':
        blockContent = '<ol class="list-decimal list-inside ml-4"><li contenteditable="true">Numbered item</li></ol>';
        break;
      case 'quote':
        blockContent = '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic py-2" contenteditable="true">Quote</blockquote>';
        break;
      case 'code':
        blockContent = '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-sm" contenteditable="true"><code>Code block</code></pre>';
        break;
      default:
        blockContent = '<p contenteditable="true">New paragraph</p>';
    }
    
    blockWrapper.innerHTML = blockContent;
    
    // Add escape button for code and quote blocks (only if one doesn't already exist)
    if (type === 'code' || type === 'quote') {
      // Check if exit button already exists
      const existingBtn = blockWrapper.querySelector('button[data-exit-btn]');
      if (!existingBtn) {
        const escapeBtn = document.createElement('button');
        escapeBtn.className = 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 z-10';
        escapeBtn.textContent = 'Exit';
        escapeBtn.type = 'button';
        escapeBtn.setAttribute('data-exit-btn', 'true');
        escapeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Create a new paragraph after the block
          const newP = document.createElement('p');
          newP.className = 'mb-2';
          newP.innerHTML = '<br>';
          if (blockWrapper.parentNode) {
            blockWrapper.parentNode.insertBefore(newP, blockWrapper.nextSibling);
            // Move cursor to new paragraph
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            const newSelection = window.getSelection();
            newSelection?.removeAllRanges();
            newSelection?.addRange(newRange);
            // Update content
            if (editorRef.current) {
              const newContent = editorRef.current.innerHTML;
              setContent(newContent);
              isUserTypingRef.current = true;
            }
          }
        };
        blockWrapper.appendChild(escapeBtn);
      }
    }
    
    if (range && selection) {
      try {
        // Insert at cursor position
        range.insertNode(blockWrapper);
        // Set cursor inside the block
        const blockEditable = blockWrapper.querySelector('[contenteditable="true"]');
        if (blockEditable) {
          setTimeout(() => {
            const newRange = document.createRange();
            newRange.selectNodeContents(blockEditable);
            newRange.collapse(false);
            const newSelection = window.getSelection();
            newSelection?.removeAllRanges();
            newSelection?.addRange(newRange);
            // Update content
            if (editorRef.current) {
              const newContent = editorRef.current.innerHTML;
              setContent(newContent);
              isUserTypingRef.current = true;
            }
          }, 0);
        } else {
          // If no editable element, move cursor after block
          range.setStartAfter(blockWrapper);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (err) {
        // Fallback: append to editor
        if (editorRef.current) {
          editorRef.current.appendChild(blockWrapper);
        }
      }
    } else {
      // If no selection, append to editor
      if (editorRef.current) {
        editorRef.current.appendChild(blockWrapper);
        // Set cursor inside the block
        setTimeout(() => {
          const blockEditable = blockWrapper.querySelector('[contenteditable="true"]');
          if (blockEditable) {
            const newRange = document.createRange();
            newRange.selectNodeContents(blockEditable);
            newRange.collapse(false);
            const newSelection = window.getSelection();
            newSelection?.removeAllRanges();
            newSelection?.addRange(newRange);
            // Update content
            if (editorRef.current) {
              const newContent = editorRef.current.innerHTML;
              setContent(newContent);
              isUserTypingRef.current = true;
            }
          }
        }, 0);
      }
    }
  }, []);

  // Keyboard shortcuts with escape functionality
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle escape from code/quote blocks (Ctrl+Enter)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const blockWrapper = (container.nodeType === Node.TEXT_NODE 
          ? container.parentElement?.closest('[data-block-type]')
          : (container as Element)?.closest('[data-block-type]')) as HTMLElement;
        
        if (blockWrapper && (blockWrapper.getAttribute('data-block-type') === 'code' || blockWrapper.getAttribute('data-block-type') === 'quote')) {
          e.preventDefault();
          // Create a new paragraph after the block
          const newP = document.createElement('p');
          newP.className = 'mb-2';
          newP.innerHTML = '<br>';
          if (blockWrapper.parentNode) {
            blockWrapper.parentNode.insertBefore(newP, blockWrapper.nextSibling);
            // Move cursor to new paragraph
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            // Update content
            if (editorRef.current) {
              const newContent = editorRef.current.innerHTML;
              setContent(newContent);
              isUserTypingRef.current = true;
            }
          }
          return;
        }
      }
    }
    
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
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
          if (selectedNote) {
            // Convert HTML to JSON for save
            const htmlContent = editorRef.current?.innerHTML || content || '';
            const jsonContent = JSON.stringify({ html: htmlContent, type: 'rich-text' });
            updateNote.mutate({
              id: selectedNote.id,
              title,
              content: jsonContent
            });
          }
          break;
      }
    }
  }, [formatText, selectedNote, title, content, updateNote]);

  // Handle create note
  const handleCreateNote = useCallback(() => {
    if (!title.trim()) {
      toast.error('Please enter a note title');
      return;
    }
    
    // Convert HTML content to JSON string as backend expects
    const htmlContent = editorRef.current?.innerHTML || content || '';
    const jsonContent = JSON.stringify({ html: htmlContent, type: 'rich-text' });
    
    createNote.mutate({
      projectId: projectId || '',
      title: title.trim(),
      content: jsonContent,
      tags: noteTags,
    }, {
      onSuccess: (newNote) => {
        // Close the add note form
        setIsAddNoteOpen(false);
        
        // Clear form state first
        setTitle('');
        setContent('');
        setNoteTags([]);
        setIsPinned(false);
        setIsStarred(false);
        if (editorRef.current) {
          editorRef.current.innerHTML = '<p><br></p>';
        }
        lastSavedRef.current = '';
        
        // Then set the new note (this will trigger the useEffect to load it properly)
        // Use setTimeout to ensure state is cleared first
        setTimeout(() => {
          setSelectedNote(newNote);
        }, 0);
        
        toast.success('Note created successfully');
        // Force refetch notes to show in sidebar
        queryClient.invalidateQueries({ 
          queryKey: noteKeys.list(projectId)
        });
        // Also manually refetch to ensure immediate update
        refetchNotes();
      },
      onError: (error: any) => {
        console.error('Create note error:', error);
        toast.error(error?.response?.data?.message || error?.message || 'Failed to create note');
      }
    });
  }, [title, content, projectId, createNote, noteTags, isPinned, isStarred, queryClient, refetchNotes]);

  // Handle add tag
  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !noteTags.includes(newTag.trim())) {
      setNoteTags([...noteTags, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, noteTags]);

  // Handle remove tag (don't allow removing special tags)
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    if (tagToRemove === '_pinned' || tagToRemove === '_starred') {
      return; // Don't allow removing special tags
    }
    setNoteTags(noteTags.filter(tag => tag !== tagToRemove));
  }, [noteTags]);

  // Handle toggle pin (stored in tags for now, can be moved to dedicated field later)
  const handleTogglePin = useCallback(() => {
    if (selectedNote) {
      // Store pin status in tags (using special tag prefix)
      const updatedTags = isPinned 
        ? noteTags.filter(tag => tag !== '_pinned')
        : [...noteTags.filter(tag => tag !== '_pinned'), '_pinned'];
      
      const htmlContent = editorRef.current?.innerHTML || content || '';
      const jsonContent = JSON.stringify({ html: htmlContent, type: 'rich-text' });
      
      updateNote.mutate({
        id: selectedNote.id,
        title,
        content: jsonContent,
        tags: updatedTags,
      }, {
        onSuccess: () => {
          setIsPinned(!isPinned);
          setNoteTags(updatedTags);
          queryClient.invalidateQueries({ queryKey: noteKeys.list(projectId) });
          queryClient.refetchQueries({ queryKey: noteKeys.list(projectId) });
          toast.success(isPinned ? 'Note unpinned' : 'Note pinned');
        }
      });
    } else {
      setIsPinned(!isPinned);
    }
  }, [selectedNote, isPinned, updateNote, title, content, noteTags, projectId, queryClient]);

  // Handle toggle star (stored in tags for now, can be moved to dedicated field later)
  const handleToggleStar = useCallback(() => {
    if (selectedNote) {
      // Store star status in tags (using special tag prefix)
      const updatedTags = isStarred 
        ? noteTags.filter(tag => tag !== '_starred')
        : [...noteTags.filter(tag => tag !== '_starred'), '_starred'];
      
      const htmlContent = editorRef.current?.innerHTML || content || '';
      const jsonContent = JSON.stringify({ html: htmlContent, type: 'rich-text' });
      
      updateNote.mutate({
        id: selectedNote.id,
        title,
        content: jsonContent,
        tags: updatedTags,
      }, {
        onSuccess: () => {
          setIsStarred(!isStarred);
          setNoteTags(updatedTags);
          queryClient.invalidateQueries({ queryKey: noteKeys.list(projectId) });
          queryClient.refetchQueries({ queryKey: noteKeys.list(projectId) });
          toast.success(isStarred ? 'Note unstarred' : 'Note starred');
        }
      });
    } else {
      setIsStarred(!isStarred);
    }
  }, [selectedNote, isStarred, updateNote, title, content, noteTags, projectId, queryClient]);

  // Handle export note
  const handleExportNote = useCallback((format: 'txt' | 'md' | 'html') => {
    if (!selectedNote && !isAddNoteOpen) return;
    
    let content = '';
    let filename = `${title || 'note'}.${format}`;
    
    switch (format) {
      case 'txt':
        content = `${title}\n\n${editorRef.current?.innerText || content}`;
        break;
      case 'md':
        content = `# ${title}\n\n${editorRef.current?.innerText || content}`;
        break;
      case 'html':
        content = `<!DOCTYPE html><html><head><title>${title}</title></head><body>${editorRef.current?.innerHTML || content}</body></html>`;
        break;
    }
    
    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Note exported');
  }, [selectedNote, isAddNoteOpen, title]);

  // Handle copy note link
  const handleCopyLink = useCallback(() => {
    if (selectedNote) {
      const link = `${window.location.origin}/projects/${projectId}/notes/${selectedNote.id}`;
      navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard');
    }
  }, [selectedNote, projectId]);

  // Handle duplicate note
  const handleDuplicateNote = useCallback(() => {
    if (selectedNote) {
      createNote.mutate({
        projectId: projectId || '',
        title: `${selectedNote.title} (Copy)`,
        content: selectedNote.content || '',
        category: selectedNote.category || 'Uncategorized',
        tags: selectedNote.tags || []
      }, {
        onSuccess: () => {
          toast.success('Note duplicated');
        }
      });
    }
  }, [selectedNote, projectId, createNote]);

  // Handle delete note
  const handleDeleteNote = useCallback((noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote.mutate(noteId, {
        onSuccess: () => {
          if (selectedNote?.id === noteId) {
            setSelectedNote(null);
            setTitle('');
            setContent('');
            if (editorRef.current) {
              editorRef.current.innerHTML = '';
            }
          }
          // Refresh notes list
          queryClient.invalidateQueries({ queryKey: noteKeys.list(projectId) });
          queryClient.refetchQueries({ queryKey: noteKeys.list(projectId) });
          toast.success('Note deleted');
        }
      });
    }
  }, [selectedNote, deleteNote, queryClient, projectId]);

  // Handle title change - memoized to prevent re-renders
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  }, []);

  // Handle editor input
  const handleEditorInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    isUserTypingRef.current = true;
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    // Don't set isUserTypingRef to false immediately - let auto-save handle it
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  // Handle category filter change
  const handleFilterCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  if (notesLoading) {
    return <div className="p-8 text-center">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Notes</h2>
          <p className="text-muted-foreground">Manage your project notes and documentation</p>
        </div>
        <Button onClick={() => {
          // Automatically create a new note with default title
          const defaultTitle = `New Note ${new Date().toLocaleDateString()}`;
          const defaultContent = JSON.stringify({ html: '<p><br></p>', type: 'rich-text' });
          
          createNote.mutate({
            projectId: projectId || '',
            title: defaultTitle,
            content: defaultContent,
            tags: [],
          }, {
            onSuccess: (newNote) => {
              // Set the new note as selected immediately - this will trigger useEffect to load it
              setSelectedNote(newNote);
              setIsAddNoteOpen(false);
              
              toast.success('Note created successfully');
              // Force refetch notes to show in sidebar
              queryClient.invalidateQueries({ 
                queryKey: noteKeys.list(projectId)
              });
              refetchNotes();
            },
            onError: (error: any) => {
              console.error('Create note error:', error);
              toast.error(error?.response?.data?.message || error?.message || 'Failed to create note');
            }
          });
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Insights Section - At the Top */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalNotes}</div>
            <p className="text-xs text-muted-foreground">All project notes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(insights.totalWords || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all notes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.categoriesCount}</div>
            <p className="text-xs text-muted-foreground">Unique categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Notes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.recentNotes}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Notes organized by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(insights.categoryDistribution).map(([category, count]: [string, any]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${insights.totalNotes > 0 ? (count / insights.totalNotes) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <div className="space-y-4">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterCategoryChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Notes</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  {notes.filter((n: any) => {
                    const noteTags = (n.tags || []).filter((tag: string) => !tag.startsWith('_'));
                    return noteTags.length === 0;
                  }).length > 0 && (
                    <option value="Untagged">Untagged</option>
                  )}
                </select>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'category')}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="category">Sort by Category</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredAndSortedNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No notes found</p>
                  </div>
                ) : (
                  filteredAndSortedNotes.map((note: any) => (
                    <Card
                      key={note.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedNote(note)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {note.isPinned && <Pin className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                            {note.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
                            <h3 className="font-semibold text-lg line-clamp-2">{note.title}</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {(() => {
                            try {
                              let contentText = note.content || '';
                              // Parse JSON if it's a JSON string
                              if (typeof contentText === 'string' && contentText.trim().startsWith('{')) {
                                const parsed = JSON.parse(contentText);
                                contentText = parsed?.html || parsed?.content || contentText;
                              }
                              // Remove HTML tags and get plain text
                              const textContent = contentText.replace(/<[^>]*>/g, '').trim();
                              return textContent || 'No content';
                            } catch {
                              // If parsing fails, try to strip HTML tags directly
                              const textContent = (note.content || '').replace(/<[^>]*>/g, '').trim();
                              return textContent || 'No content';
                            }
                          })()}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {note.tags && note.tags.length > 0 && (() => {
                            const visibleTags = note.tags.filter((tag: string) => tag !== '_pinned' && tag !== '_starred');
                            if (visibleTags.length === 0) return null;
                            return (
                              <div className="flex items-center gap-1 flex-wrap">
                                {visibleTags.slice(0, 2).map((tag: string) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    <Hash className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {visibleTags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{visibleTags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            );
                          })()}
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 space-y-4">
              {selectedNote || isAddNoteOpen ? (
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Input
                        ref={titleInputRef}
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Note title..."
                        className="text-2xl font-bold border-none focus-visible:ring-0 p-0 h-auto"
                        key={`title-input-${selectedNote?.id || 'new'}`}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleTogglePin}
                          className={isPinned ? 'text-blue-500' : ''}
                          title={isPinned ? 'Unpin note' : 'Pin note'}
                        >
                          <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleToggleStar}
                          className={isStarred ? 'text-yellow-500' : ''}
                          title={isStarred ? 'Unstar note' : 'Star note'}
                        >
                          <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
                        </Button>
                        {(selectedNote || isAddNoteOpen) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" title="Export note">
                                <FileDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleExportNote('txt')}>
                                Export as TXT
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportNote('md')}>
                                Export as Markdown
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportNote('html')}>
                                Export as HTML
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {selectedNote && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCopyLink}
                              title="Copy link"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleDuplicateNote}
                              title="Duplicate note"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDarkMode(!darkMode)}
                          title="Toggle dark mode"
                        >
                          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        {selectedNote && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(selectedNote.id)}
                            title="Delete note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                      </div>
                    )}

                    {/* Toolbar */}
                    <div className="border-b pb-2 mb-4 flex items-center gap-2 flex-wrap">
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
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => formatText('bold')}
                          className="h-8 w-8 p-0"
                          title="Bold (Ctrl+B)"
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => formatText('italic')}
                          className="h-8 w-8 p-0"
                          title="Italic (Ctrl+I)"
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => formatText('underline')}
                          className="h-8 w-8 p-0"
                          title="Underline (Ctrl+U)"
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

                      {isAddNoteOpen && (
                        <div className="ml-auto flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsAddNoteOpen(false);
                              setTitle('');
                              setContent('');
                              setNoteTags([]);
                              setIsPinned(false);
                              setIsStarred(false);
                              if (editorRef.current) {
                                editorRef.current.innerHTML = '';
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreateNote}>
                            <Save className="h-4 w-4 mr-2" />
                            Create Note
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Tags Section */}
                    <div className="border-b pb-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label className="text-sm font-medium">Tags:</Label>
                        {noteTags.filter(tag => tag !== '_pinned' && tag !== '_starred').map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="Add tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            className="w-24 h-7 text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddTag}
                            className="h-7"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Editor */}
                    <div className="relative">
                      <div
                        ref={editorRef}
                        className="min-h-[400px] outline-none prose max-w-none relative z-10"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onInput={(e) => {
                          handleEditorInput(e);
                          // Force re-render to update placeholder visibility
                          const target = e.currentTarget;
                          if (target.innerText?.trim()) {
                            // Content exists, ensure placeholder is hidden
                            setContent(target.innerHTML);
                          }
                        }}
                        onSelect={handleSelection}
                        onKeyDown={handleKeyDown}
                        style={{
                          lineHeight: '1.6',
                          fontSize: '16px',
                          padding: '16px'
                        }}
                      />
                      
                      {(() => {
                        // Only show placeholder if editor is truly empty
                        if (!editorRef.current) return true;
                        const text = editorRef.current.innerText?.trim() || '';
                        const html = editorRef.current.innerHTML?.trim() || '';
                        // Check if editor only has empty paragraph or br
                        const isEmpty = text === '' && (html === '' || html === '<p><br></p>' || html === '<br>' || html === '<p></p>');
                        return isEmpty;
                      })() && (
                        <div className="absolute top-4 left-4 pointer-events-none text-gray-400 dark:text-gray-500 text-sm z-0">
                          Start typing or use the toolbar to add content...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No note selected</h3>
                    <p className="text-muted-foreground mb-4">Select a note from the list or create a new one</p>
                    <Button onClick={() => setIsAddNoteOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Note
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default ProjectNotesView;
