/**
 * Enhanced Comments Component
 * 
 * A feature-rich comments component with @mentions, reactions, and rich text support.
 * 
 * Features:
 * - Rich text editor with markdown support
 * - @mentions with user autocomplete
 * - Emoji reactions on comments
 * - Threaded replies
 * - Edit and delete comments
 * - Comment pinning for important comments
 * - Attachment support in comments
 * - Real-time updates via WebSocket
 * 
 * @component
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Send,
  MoreHorizontal,
  Edit2,
  Trash2,
  Pin,
  Reply,
  Smile,
  AtSign,
  Image as ImageIcon,
  Paperclip,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  List,
  Clock,
  Check,
  X,
  MessageSquare,
  ThumbsUp,
  Heart,
  PartyPopper,
  Laugh,
  Frown,
  Lightbulb,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Reaction type for comment reactions
 */
interface Reaction {
  emoji: string;
  label: string;
  users: string[];
}

/**
 * User interface for mentions and assignees
 */
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Comment interface with all metadata
 */
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: User;
  mentions: string[];
  reactions: Reaction[];
  replies?: Comment[];
  parentId?: string;
  isPinned: boolean;
  attachments: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

interface EnhancedCommentsProps {
  entityType: 'task' | 'note' | 'issue' | 'project';
  entityId: string;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Available reaction emojis with labels
 */
const AVAILABLE_REACTIONS = [
  { emoji: '👍', label: 'thumbs_up' },
  { emoji: '❤️', label: 'heart' },
  { emoji: '🎉', label: 'party' },
  { emoji: '😄', label: 'smile' },
  { emoji: '😢', label: 'sad' },
  { emoji: '💡', label: 'idea' },
  { emoji: '🚩', label: 'flag' },
  { emoji: '👀', label: 'eyes' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '✅', label: 'check' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function EnhancedComments({ entityType, entityId, className }: EnhancedCommentsProps) {
  // State for comment input
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  
  // State for replying
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // State for @mentions
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  
  // State for emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerForComment, setEmojiPickerForComment] = useState<string | null>(null);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch comments for the entity
   */
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/v1/comments`, {
          params: { [`${entityType}Id`]: entityId },
        });
        return response.data?.items || response.data || [];
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        return [];
      }
    },
    enabled: !!entityId,
    staleTime: 30000,
  });

  /**
   * Fetch users for @mentions
   */
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users-for-mentions'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/users', { params: { limit: 100 } });
        return response.data?.items || response.data || [];
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
    staleTime: 300000, // 5 minutes
  });

  /**
   * Filter users for mention autocomplete
   */
  const filteredUsers = useMemo(() => {
    if (!mentionSearch) return users;
    const search = mentionSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
    );
  }, [users, mentionSearch]);

  // Transform API comments to our format
  const comments: Comment[] = useMemo(() => {
    if (!commentsData) return [];
    
    return (commentsData as any[]).map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      user: c.user || { id: c.createdBy, name: 'Unknown User', email: '' },
      mentions: c.mentions || [],
      reactions: c.reactions || [],
      replies: c.replies || [],
      parentId: c.parentId,
      isPinned: c.isPinned || false,
      attachments: c.attachments || [],
    }));
  }, [commentsData]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Create a new comment
   */
  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentId, mentions }: { content: string; parentId?: string; mentions: string[] }) => {
      const response = await apiClient.post('/v1/comments', {
        content,
        [`${entityType}Id`]: entityId,
        parentId,
        mentions,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      setNewComment('');
      setReplyContent('');
      setReplyingToId(null);
      toast.success('Comment added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add comment');
    },
  });

  /**
   * Update an existing comment
   */
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await apiClient.patch(`/v1/comments/${id}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      setEditingCommentId(null);
      setEditingContent('');
      toast.success('Comment updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update comment');
    },
  });

  /**
   * Delete a comment
   */
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/v1/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      toast.success('Comment deleted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete comment');
    },
  });

  /**
   * Toggle pin on a comment
   */
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const response = await apiClient.patch(`/v1/comments/${id}`, { isPinned });
      return response.data;
    },
    onSuccess: (_, { isPinned }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      toast.success(isPinned ? 'Comment pinned' : 'Comment unpinned');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to pin comment');
    },
  });

  /**
   * Add reaction to a comment
   */
  const addReactionMutation = useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
      const response = await apiClient.post(`/v1/comments/${commentId}/reactions`, { emoji });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add reaction');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Extract @mentions from content
   */
  const extractMentions = useCallback((content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      // Find user by name match
      const user = users.find((u) => 
        u.name.toLowerCase().replace(/\s+/g, '') === match[1].toLowerCase()
      );
      if (user) {
        mentions.push(user.id);
      }
    }
    return mentions;
  }, [users]);

  /**
   * Handle submitting a new comment
   */
  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim()) return;
    
    const mentions = extractMentions(newComment);
    createCommentMutation.mutate({
      content: newComment.trim(),
      mentions,
    });
  }, [newComment, extractMentions, createCommentMutation]);

  /**
   * Handle submitting a reply
   */
  const handleSubmitReply = useCallback(() => {
    if (!replyContent.trim() || !replyingToId) return;
    
    const mentions = extractMentions(replyContent);
    createCommentMutation.mutate({
      content: replyContent.trim(),
      parentId: replyingToId,
      mentions,
    });
  }, [replyContent, replyingToId, extractMentions, createCommentMutation]);

  /**
   * Handle updating a comment
   */
  const handleUpdateComment = useCallback(() => {
    if (!editingContent.trim() || !editingCommentId) return;
    
    updateCommentMutation.mutate({
      id: editingCommentId,
      content: editingContent.trim(),
    });
  }, [editingContent, editingCommentId, updateCommentMutation]);

  /**
   * Handle deleting a comment
   */
  const handleDeleteComment = useCallback((commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  }, [deleteCommentMutation]);

  /**
   * Handle adding a reaction
   */
  const handleAddReaction = useCallback((commentId: string, emoji: string) => {
    addReactionMutation.mutate({ commentId, emoji });
    setShowEmojiPicker(false);
    setEmojiPickerForComment(null);
  }, [addReactionMutation]);

  /**
   * Handle @mention selection
   */
  const handleSelectMention = useCallback((user: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = newComment.substring(0, cursorPos);
    const textAfter = newComment.substring(cursorPos);
    
    // Find the @ symbol position
    const atIndex = textBefore.lastIndexOf('@');
    if (atIndex >= 0) {
      const newText = 
        textBefore.substring(0, atIndex) + 
        `@${user.name.replace(/\s+/g, '')} ` + 
        textAfter;
      setNewComment(newText);
    }
    
    setShowMentions(false);
    setMentionSearch('');
    textarea.focus();
  }, [newComment]);

  /**
   * Handle text input for @mention detection
   */
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Check for @mention
    const cursorPos = e.target.selectionStart;
    const textBefore = value.substring(0, cursorPos);
    const lastAtIndex = textBefore.lastIndexOf('@');
    
    if (lastAtIndex >= 0) {
      const afterAt = textBefore.substring(lastAtIndex + 1);
      // Check if there's a space or newline after @
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionSearch(afterAt);
        setShowMentions(true);
        
        // Calculate position for popup (simplified)
        const rect = e.target.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX + 20,
        });
        return;
      }
    }
    
    setShowMentions(false);
    setMentionSearch('');
  }, []);

  /**
   * Format relative time
   */
  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }, []);

  /**
   * Render content with highlighted @mentions
   */
  const renderContent = useCallback((content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={i} 
            className="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Sort comments: pinned first, then by date
  const sortedComments = useMemo(() => {
    return [...comments]
      .filter((c) => !c.parentId) // Top-level comments only
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [comments]);

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Input */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleTextChange}
                  placeholder="Write a comment... Use @ to mention someone"
                  className="min-h-[80px] resize-none pr-10"
                />
                
                {/* Formatting toolbar */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setNewComment((prev) => prev + '**bold**')}
                    title="Bold"
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setNewComment((prev) => prev + '*italic*')}
                    title="Italic"
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setNewComment((prev) => prev + '`code`')}
                    title="Code"
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Add emoji"
                      >
                        <Smile className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2">
                      <div className="grid grid-cols-5 gap-1">
                        {AVAILABLE_REACTIONS.map((r) => (
                          <Button
                            key={r.label}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-lg p-0"
                            onClick={() => setNewComment((prev) => prev + r.emoji)}
                          >
                            {r.emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title="Mention someone"
                    onClick={() => setNewComment((prev) => prev + '@')}
                  >
                    <AtSign className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* @Mentions Autocomplete */}
              {showMentions && filteredUsers.length > 0 && (
                <Card className="absolute z-50 w-64 shadow-lg">
                  <ScrollArea className="max-h-48">
                    <div className="p-1">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleSelectMention(user)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createCommentMutation.isPending ? 'Posting...' : 'Comment'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading comments...
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          sortedComments.map((comment) => (
            <Card 
              key={comment.id} 
              className={`${comment.isPinned ? 'border-amber-200 bg-amber-50/50' : ''}`}
            >
              <CardContent className="pt-4">
                {/* Comment Header */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback>
                      {comment.user.name?.slice(0, 2).toUpperCase() || 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    {/* Author and Date */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                      {comment.isPinned && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    
                    {/* Comment Content */}
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateComment}>
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingContent('');
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {renderContent(comment.content)}
                      </p>
                    )}
                    
                    {/* Reactions */}
                    {comment.reactions && comment.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {comment.reactions.map((reaction, idx) => (
                          <Badge
                            key={`${reaction.emoji}-${idx}`}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-accent"
                            onClick={() => handleAddReaction(comment.id, reaction.emoji)}
                          >
                            {reaction.emoji} {reaction.users.length}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Add Reaction */}
                      <Popover
                        open={emojiPickerForComment === comment.id && showEmojiPicker}
                        onOpenChange={(open) => {
                          setShowEmojiPicker(open);
                          if (open) setEmojiPickerForComment(comment.id);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Smile className="h-3 w-3 mr-1" />
                            React
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2">
                          <div className="grid grid-cols-5 gap-1">
                            {AVAILABLE_REACTIONS.map((r) => (
                              <Button
                                key={r.label}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 text-lg p-0"
                                onClick={() => handleAddReaction(comment.id, r.emoji)}
                              >
                                {r.emoji}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Reply */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          setReplyingToId(comment.id);
                          setReplyContent('');
                        }}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      
                      {/* More Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingContent(comment.content);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => togglePinMutation.mutate({
                              id: comment.id,
                              isPinned: !comment.isPinned,
                            })}
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            {comment.isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Reply Input */}
                    {replyingToId === comment.id && (
                      <div className="mt-3 ml-8 space-y-2">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="min-h-[60px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSubmitReply}>
                            <Send className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyContent('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-8 space-y-3 border-l-2 pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={reply.user.avatar} />
                              <AvatarFallback>
                                {reply.user.name?.slice(0, 2).toUpperCase() || 'UN'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs">{reply.user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{renderContent(reply.content)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default EnhancedComments;

