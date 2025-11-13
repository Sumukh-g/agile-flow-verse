import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Activity,
    Bell,
    BellOff,
    CheckCircle,
    Edit,
    MessageCircle,
    Share2,
    UserMinus,
    UserPlus,
    Users,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen?: Date;
  currentSection?: string;
  cursorPosition?: { x: number; y: number };
  color: string;
}

interface Comment {
  id: string;
  author: Collaborator;
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies: Comment[];
  position?: { x: number; y: number };
}

interface Activity {
  id: string;
  type: 'edit' | 'comment' | 'join' | 'leave' | 'share' | 'rename';
  user: Collaborator;
  description: string;
  timestamp: Date;
  metadata?: any;
}

interface RealTimeCollaborationProps {
  pageId: string;
  currentUser: Collaborator;
  onCollaboratorsChange: (collaborators: Collaborator[]) => void;
  onCommentsChange: (comments: Comment[]) => void;
  onActivityChange: (activities: Activity[]) => void;
  className?: string;
}

const RealTimeCollaboration: React.FC<RealTimeCollaborationProps> = ({
  pageId,
  currentUser,
  onCollaboratorsChange,
  onCommentsChange,
  onActivityChange,
  className = ''
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'owner',
      isOnline: true,
      currentSection: 'Introduction',
      color: '#3B82F6'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      isOnline: true,
      currentSection: 'Content',
      color: '#10B981'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@example.com',
      role: 'viewer',
      isOnline: false,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      color: '#F59E0B'
    }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: collaborators[1],
      content: 'This section needs more detail about the implementation.',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      resolved: false,
      replies: [],
      position: { x: 100, y: 200 }
    },
    {
      id: '2',
      author: collaborators[0],
      content: 'Great point! I\'ll add more details.',
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      resolved: false,
      replies: []
    }
  ]);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'edit',
      user: collaborators[1],
      description: 'edited the Introduction section',
      timestamp: new Date(Date.now() - 3 * 60 * 1000)
    },
    {
      id: '2',
      type: 'comment',
      user: collaborators[1],
      description: 'added a comment on the Content section',
      timestamp: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: '3',
      type: 'join',
      user: collaborators[2],
      description: 'joined the page',
      timestamp: new Date(Date.now() - 10 * 60 * 1000)
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate user activity
      const randomUser = collaborators[Math.floor(Math.random() * collaborators.length)];
      if (randomUser.isOnline && Math.random() > 0.7) {
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: 'edit',
          user: randomUser,
          description: `edited the ${randomUser.currentSection} section`,
          timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [collaborators]);

  const handleInviteCollaborator = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      isOnline: false,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };

    setCollaborators(prev => [...prev, newCollaborator]);
    onCollaboratorsChange([...collaborators, newCollaborator]);

    const inviteActivity: Activity = {
      id: Date.now().toString(),
      type: 'share',
      user: currentUser,
      description: `invited ${inviteEmail} as ${inviteRole}`,
      timestamp: new Date()
    };
    setActivities(prev => [inviteActivity, ...prev.slice(0, 9)]);

    setInviteEmail('');
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (collaborator) {
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
      onCollaboratorsChange(collaborators.filter(c => c.id !== collaboratorId));

      const leaveActivity: Activity = {
        id: Date.now().toString(),
        type: 'leave',
        user: collaborator,
        description: 'was removed from the page',
        timestamp: new Date()
      };
      setActivities(prev => [leaveActivity, ...prev.slice(0, 9)]);

      toast.success(`${collaborator.name} removed from collaborators`);
    }
  };

  const handleUpdateRole = (collaboratorId: string, newRole: 'owner' | 'editor' | 'viewer') => {
    setCollaborators(prev => prev.map(c => 
      c.id === collaboratorId ? { ...c, role: newRole } : c
    ));
    onCollaboratorsChange(collaborators.map(c => 
      c.id === collaboratorId ? { ...c, role: newRole } : c
    ));
    toast.success('Role updated successfully');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: currentUser,
      content: newComment,
      timestamp: new Date(),
      resolved: false,
      replies: []
    };

    setComments(prev => [...prev, comment]);
    onCommentsChange([...comments, comment]);

    const commentActivity: Activity = {
      id: Date.now().toString(),
      type: 'comment',
      user: currentUser,
      description: 'added a comment',
      timestamp: new Date()
    };
    setActivities(prev => [commentActivity, ...prev.slice(0, 9)]);

    setNewComment('');
    toast.success('Comment added');
  };

  const handleResolveComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
    onCommentsChange(comments.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
    toast.success('Comment resolved');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/pages/${pageId}`);
    toast.success('Page link copied to clipboard');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Collaboration</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {collaborators.filter(c => c.isOnline).length} online
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
            >
              {isNotificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collaborators */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Collaborators</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCollaborators(!showCollaborators)}
            >
              {showCollaborators ? 'Hide' : 'Show'}
            </Button>
          </CardHeader>
          {showCollaborators && (
            <CardContent className="space-y-4">
              {/* Invite Form */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
                <Button size="sm" onClick={handleInviteCollaborator} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>

              {/* Collaborators List */}
              <div className="space-y-3">
                {collaborators.map(collaborator => (
                  <div key={collaborator.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback 
                            className="text-xs"
                            style={{ backgroundColor: collaborator.color }}
                          >
                            {collaborator.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {collaborator.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{collaborator.name}</p>
                        <p className="text-xs text-gray-500">{collaborator.email}</p>
                        {collaborator.currentSection && (
                          <p className="text-xs text-blue-600">Editing: {collaborator.currentSection}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(collaborator.role)}>
                        {collaborator.role}
                      </Badge>
                      {currentUser.role === 'owner' && collaborator.id !== currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Comments</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              {showComments ? 'Hide' : 'Show'}
            </Button>
          </CardHeader>
          {showComments && (
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-2">
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                  rows={2}
                />
                <Button size="sm" onClick={handleAddComment} className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map(comment => (
                  <div key={comment.id} className={`p-3 border rounded-lg ${comment.resolved ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-start space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {comment.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{comment.author.name}</p>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.timestamp)}
                          </span>
                          {comment.resolved && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                        {!comment.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id)}
                            className="mt-2 h-6 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Activity</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActivity(!showActivity)}
            >
              {showActivity ? 'Hide' : 'Show'}
            </Button>
          </CardHeader>
          {showActivity && (
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 p-2 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {activity.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">{activity.user.name}</p>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {activity.type === 'edit' && <Edit className="h-4 w-4 text-blue-500" />}
                      {activity.type === 'comment' && <MessageCircle className="h-4 w-4 text-green-500" />}
                      {activity.type === 'join' && <UserPlus className="h-4 w-4 text-purple-500" />}
                      {activity.type === 'leave' && <UserMinus className="h-4 w-4 text-red-500" />}
                      {activity.type === 'share' && <Share2 className="h-4 w-4 text-orange-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Online Status Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Live Collaboration</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Real-time updates enabled</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {collaborators.filter(c => c.isOnline).length} online
              </Badge>
              <Badge variant="outline">
                {comments.filter(c => !c.resolved).length} unresolved comments
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeCollaboration;