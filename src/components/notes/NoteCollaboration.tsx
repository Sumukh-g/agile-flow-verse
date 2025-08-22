import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    CheckCircle,
    Copy,
    Eye,
    MessageSquare,
    MoreHorizontal,
    RotateCcw,
    Save,
    Send,
    Share,
    UserPlus,
    Users
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface NoteCollaborationProps {
  note: any;
  onUpdateNote: (noteId: string, updates: any) => void;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  lastActive: Date;
  isOnline: boolean;
  isTyping: boolean;
  cursorPosition?: { x: number; y: number };
}

interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  replies: Comment[];
  resolved: boolean;
  position?: { x: number; y: number };
}

interface Version {
  id: string;
  version: number;
  author: string;
  timestamp: Date;
  changes: string[];
  content: string;
}

const NoteCollaboration: React.FC<NoteCollaborationProps> = ({ note, onUpdateNote }) => {
  const [activeTab, setActiveTab] = useState('collaborators');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
      role: 'owner',
      lastActive: new Date(),
      isOnline: true,
      isTyping: false
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '',
      role: 'editor',
      lastActive: new Date(Date.now() - 300000),
      isOnline: false,
      isTyping: false
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@example.com',
      avatar: '',
      role: 'commenter',
      lastActive: new Date(Date.now() - 600000),
      isOnline: true,
      isTyping: true
    }
  ]);
  
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Jane Smith',
      authorAvatar: '',
      content: 'Great work on this section! Consider adding more examples.',
      timestamp: new Date(Date.now() - 3600000),
      replies: [],
      resolved: false
    },
    {
      id: '2',
      author: 'Mike Wilson',
      authorAvatar: '',
      content: 'I think we should restructure this part for better clarity.',
      timestamp: new Date(Date.now() - 7200000),
      replies: [
        {
          id: '2-1',
          author: 'John Doe',
          authorAvatar: '',
          content: 'Agreed! Let me work on that.',
          timestamp: new Date(Date.now() - 3600000),
          replies: [],
          resolved: false
        }
      ],
      resolved: true
    }
  ]);
  
  const [versions, setVersions] = useState<Version[]>([
    {
      id: 'v1',
      version: 1,
      author: 'John Doe',
      timestamp: new Date(Date.now() - 86400000),
      changes: ['Created note'],
      content: 'Initial version'
    },
    {
      id: 'v2',
      version: 2,
      author: 'Jane Smith',
      timestamp: new Date(Date.now() - 3600000),
      changes: ['Added introduction', 'Updated formatting'],
      content: 'Enhanced version'
    }
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer' | 'commenter'>('viewer');
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [showTypingIndicator, setShowTypingIndicator] = useState(true);
  const [showCursorPositions, setShowCursorPositions] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(true);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(true);
  const [isCollaborating, setIsCollaborating] = useState(true);
  const [collaborationMode, setCollaborationMode] = useState<'real-time' | 'async'>('real-time');
  const [permissionLevel, setPermissionLevel] = useState<'public' | 'private' | 'restricted'>('private');
  const [allowComments, setAllowComments] = useState(true);
  const [allowEditing, setAllowEditing] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'manual' | 'auto'>('auto');
  const [syncFrequency, setSyncFrequency] = useState<'realtime' | '5s' | '10s' | '30s'>('realtime');
  const [offlineMode, setOfflineMode] = useState(false);
  const [dataUsage, setDataUsage] = useState<'minimal' | 'normal' | 'high'>('normal');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'team' | 'private'>('team');
  const [auditLog, setAuditLog] = useState(true);
  const [activityTracking, setActivityTracking] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'balanced' | 'performance' | 'quality'>('balanced');

  // Add collaborator
  const addCollaborator = useCallback(() => {
    if (!newCollaboratorEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const newCollaborator: Collaborator = {
      id: `collab-${Date.now()}`,
      name: newCollaboratorEmail.split('@')[0],
      email: newCollaboratorEmail,
      avatar: '',
      role: selectedRole,
      lastActive: new Date(),
      isOnline: false,
      isTyping: false
    };

    setCollaborators(prev => [...prev, newCollaborator]);
    setNewCollaboratorEmail('');
    setShowInviteDialog(false);
    toast.success(`Invited ${newCollaboratorEmail} as ${selectedRole}`);
  }, [newCollaboratorEmail, selectedRole]);

  // Remove collaborator
  const removeCollaborator = useCallback((collaboratorId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
    toast.success('Collaborator removed');
  }, []);

  // Change collaborator role
  const changeRole = useCallback((collaboratorId: string, newRole: Collaborator['role']) => {
    setCollaborators(prev => prev.map(c => 
      c.id === collaboratorId ? { ...c, role: newRole } : c
    ));
    toast.success('Role updated');
  }, []);

  // Add comment
  const addComment = useCallback(() => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: 'Current User',
      authorAvatar: '',
      content: newComment,
      timestamp: new Date(),
      replies: [],
      resolved: false
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    toast.success('Comment added');
  }, [newComment]);

  // Reply to comment
  const replyToComment = useCallback((commentId: string, replyContent: string) => {
    const reply: Comment = {
      id: `reply-${Date.now()}`,
      author: 'Current User',
      authorAvatar: '',
      content: replyContent,
      timestamp: new Date(),
      replies: [],
      resolved: false
    };

    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));
    toast.success('Reply added');
  }, []);

  // Resolve comment
  const resolveComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId ? { ...comment, resolved: true } : comment
    ));
    toast.success('Comment resolved');
  }, []);

  // Create share link
  const createShareLink = useCallback(() => {
    const link = `${window.location.origin}/notes/${note.id}?share=true`;
    setShareLink(link);
    setIsSharing(true);
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard');
  }, [note.id]);

  // Save version
  const saveVersion = useCallback(() => {
    const version: Version = {
      id: `v${versions.length + 1}`,
      version: versions.length + 1,
      author: 'Current User',
      timestamp: new Date(),
      changes: ['Manual save'],
      content: note.content
    };

    setVersions(prev => [...prev, version]);
    toast.success('Version saved');
  }, [versions.length, note.content]);

  // Restore version
  const restoreVersion = useCallback((version: Version) => {
    onUpdateNote(note.id, {
      content: version.content,
      restoredFromVersion: version.version,
      restoredAt: new Date()
    });
    toast.success(`Restored to version ${version.version}`);
  }, [note.id, onUpdateNote]);

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Collaboration</h2>
            <Badge variant={isCollaborating ? "default" : "secondary"}>
              {isCollaborating ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={createShareLink}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Collaboration Status */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{collaborators.filter(c => c.isOnline).length} online</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length} comments</span>
          </div>
          <div className="flex items-center space-x-2">
            <RotateCcw className="h-4 w-4" />
            <span>{versions.length} versions</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {collaborators.map((collaborator) => (
                  <Card key={collaborator.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={collaborator.avatar} />
                            <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{collaborator.name}</span>
                              <Badge variant="outline">{collaborator.role}</Badge>
                              {collaborator.isOnline && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{collaborator.email}</p>
                            <p className="text-xs text-gray-400">
                              Last active: {formatTimestamp(collaborator.lastActive)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {collaborator.isTyping && (
                            <span className="text-sm text-gray-500 italic">typing...</span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => changeRole(collaborator.id, 'editor')}>
                                Make Editor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeRole(collaborator.id, 'viewer')}>
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeRole(collaborator.id, 'commenter')}>
                                Make Commenter
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => removeCollaborator(collaborator.id)}
                                className="text-red-600"
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Add Comment */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button onClick={addComment} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments List */}
                {comments.map((comment) => (
                  <Card key={comment.id} className={comment.resolved ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.authorAvatar} />
                          <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">{comment.author}</span>
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                            {comment.resolved && (
                              <Badge variant="secondary">Resolved</Badge>
                            )}
                          </div>
                          <p className="text-sm mb-3">{comment.content}</p>
                          
                          {/* Replies */}
                          {comment.replies.length > 0 && (
                            <div className="ml-4 space-y-2">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={reply.authorAvatar} />
                                    <AvatarFallback>{reply.author.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-sm">{reply.author}</span>
                                      <span className="text-xs text-gray-500">
                                        {formatTimestamp(reply.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-sm">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 mt-3">
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Reply
                            </Button>
                            {!comment.resolved && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resolveComment(comment.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="versions" className="p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Version History</h3>
                  <Button size="sm" onClick={saveVersion}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Version
                  </Button>
                </div>
                
                {versions.map((version) => (
                  <Card key={version.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">Version {version.version}</span>
                            <Badge variant="outline">{version.author}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {formatTimestamp(version.timestamp)}
                          </p>
                          <div className="space-y-1">
                            {version.changes.map((change, index) => (
                              <p key={index} className="text-sm">• {change}</p>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreVersion(version)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Invite Collaborator</h3>
            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <Button onClick={addCollaborator} className="flex-1">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {isSharing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Share Note</h3>
            <div className="space-y-4">
              <div>
                <Label>Share Link</Label>
                <Input value={shareLink} readOnly />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => navigator.clipboard.writeText(shareLink)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" onClick={() => setIsSharing(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCollaboration; 