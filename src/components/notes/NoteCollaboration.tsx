import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    MessageSquare,
    Trash2,
    UserPlus,
    Users
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  joinedAt: Date;
  lastActive: Date;
}

interface Comment {
  id: string;
  author: Collaborator;
  content: string;
  createdAt: Date;
  resolved: boolean;
  replies: Comment[];
}

const NoteCollaboration: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
      role: 'owner',
      joinedAt: new Date('2023-01-15'),
      lastActive: new Date()
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '',
      role: 'editor',
      joinedAt: new Date('2023-02-20'),
      lastActive: new Date()
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      avatar: '',
      role: 'viewer',
      joinedAt: new Date('2023-03-10'),
      lastActive: new Date()
    }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: collaborators[1],
      content: 'Great work on this section! Should we add more details about the implementation?',
      createdAt: new Date('2023-05-15'),
      resolved: false,
      replies: []
    },
    {
      id: '2',
      author: collaborators[2],
      content: 'I think we need to clarify the requirements here.',
      createdAt: new Date('2023-05-14'),
      resolved: true,
      replies: [
        {
          id: '2.1',
          author: collaborators[0],
          content: 'Agreed, I\'ll update that section.',
          createdAt: new Date('2023-05-14'),
          resolved: false,
          replies: []
        }
      ]
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<'editor' | 'viewer' | 'commenter'>('viewer');

  const handleAddCollaborator = () => {
    if (newCollaboratorEmail.trim()) {
      const newCollaborator: Collaborator = {
        id: `collab_${Date.now()}`,
        name: newCollaboratorEmail.split('@')[0],
        email: newCollaboratorEmail,
        avatar: '',
        role: newCollaboratorRole,
        joinedAt: new Date(),
        lastActive: new Date()
      };
      setCollaborators(prev => [...prev, newCollaborator]);
      setNewCollaboratorEmail('');
      setShowAddCollaborator(false);
      toast.success('Collaborator added successfully');
    }
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
    toast.success('Collaborator removed');
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: `comment_${Date.now()}`,
        author: collaborators[0], // Current user
        content: newComment,
        createdAt: new Date(),
        resolved: false,
        replies: []
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    }
  };

  const handleResolveComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      case 'commenter':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Collaboration</h2>
          <p className="text-gray-600">Manage collaborators and comments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAddCollaborator(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Collaborator
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collaborators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Collaborators ({collaborators.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={collaborator.avatar} />
                      <AvatarFallback>
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{collaborator.name}</div>
                      <div className="text-xs text-gray-500">{collaborator.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getRoleColor(collaborator.role)}`}>
                      {collaborator.role}
                    </Badge>
                    {collaborator.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Comments ({comments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add comment */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Add
                </Button>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className={`p-3 border rounded-lg ${comment.resolved ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>
                          {comment.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <span className="text-xs text-gray-500">
                            {comment.createdAt.toLocaleDateString()}
                          </span>
                          {comment.resolved && (
                            <Badge variant="secondary" className="text-xs">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id)}
                          >
                            {comment.resolved ? 'Unresolve' : 'Resolve'}
                          </Button>
                          <Button variant="ghost" size="sm">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Collaborator Dialog */}
      {showAddCollaborator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Collaborator</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <select
                  value={newCollaboratorRole}
                  onChange={(e) => setNewCollaboratorRole(e.target.value as any)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddCollaborator(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCollaborator}
                disabled={!newCollaboratorEmail.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCollaboration; 