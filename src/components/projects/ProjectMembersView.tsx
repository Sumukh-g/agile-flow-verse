import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Edit,
  UserPlus,
  X,
  Crown,
  Shield,
  User,
  Eye,
} from 'lucide-react';
import React, { useState } from 'react';
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember, useUpdateMemberRole } from '@/hooks/useProjectMembers';
import { useTenantUsers } from '@/hooks/useTenantUsers';
import { useProject } from '@/hooks/useProjects';
import { useAuth } from '@/lib/auth-context';

interface ProjectMembersViewProps {
  projectId: string | undefined;
}

const PROJECT_ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full project control', icon: Crown, color: 'bg-purple-100 text-purple-800' },
  { value: 'admin', label: 'Admin', description: 'Manage members and settings', icon: Shield, color: 'bg-blue-100 text-blue-800' },
  { value: 'member', label: 'Member', description: 'Standard access', icon: User, color: 'bg-green-100 text-green-800' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access', icon: Eye, color: 'bg-gray-100 text-gray-800' },
];

export function ProjectMembersView({ projectId }: ProjectMembersViewProps) {
  const { data: membersData, isLoading } = useProjectMembers(projectId);
  const { data: tenantUsersData } = useTenantUsers();
  const { data: projectData } = useProject(projectId || '');
  const { user: currentUser } = useAuth();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const updateRole = useUpdateMemberRole();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  const members = membersData?.members || [];
  const tenantUsers = tenantUsersData?.users || [];
  const project = projectData?.data || projectData;
  const projectCreatorId = project?.createdBy;

  // Filter out users who are already members
  const availableUsers = tenantUsers.filter(
    (user: any) => !members.some((member: any) => member.userId === user.id)
  );

  // Filter users based on email input for autocomplete
  const filteredUserSuggestions = React.useMemo(() => {
    if (!emailInput || emailInput.length < 2) return [];
    const lowerInput = emailInput.toLowerCase();
    return availableUsers.filter((user: any) =>
      user.email?.toLowerCase().includes(lowerInput) ||
      user.name?.toLowerCase().includes(lowerInput)
    ).slice(0, 5); // Limit to 5 suggestions
  }, [emailInput, availableUsers]);

  const getRoleInfo = (role: string) => {
    return PROJECT_ROLES.find(r => r.value === role) || PROJECT_ROLES[2]; // Default to member
  };

  // Check if current user can manage members
  const canManage = React.useMemo(() => {
    if (!currentUser?.id) return false;
    
    // Creator can always manage
    if (projectCreatorId && (currentUser.id === projectCreatorId || String(currentUser.id) === String(projectCreatorId))) {
      return true;
    }
    
    // Check if current user is project owner/admin
    const currentUserMember = members.find(
      (m: any) => m.userId === currentUser.id || String(m.userId) === String(currentUser.id)
    );
    
    return currentUserMember && ['owner', 'admin'].includes(currentUserMember.role);
  }, [currentUser?.id, projectCreatorId, members]);

  const handleAddMember = async () => {
    if (!projectId) return;

    // Validate email format if using email
    if (emailInput && !emailInput.includes('@')) {
      return; // Invalid email, will be caught by validation
    }

    try {
      // Use email if provided, otherwise use userId
      const payload: any = {
        projectId,
        role: selectedRole,
      };

      if (emailInput.trim()) {
        payload.email = emailInput.trim();
      } else if (selectedUserId) {
        payload.userId = selectedUserId;
      } else {
        return; // No email or userId provided
      }

      await addMember.mutateAsync(payload);
      setIsInviteOpen(false);
      setEmailInput('');
      setSelectedUserId('');
      setSelectedRole('member');
      setShowUserSuggestions(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);
    setSelectedUserId(''); // Clear userId when typing email
    setShowUserSuggestions(value.length >= 2 && filteredUserSuggestions.length > 0);
  };

  const handleSelectUser = (user: any) => {
    setEmailInput(user.email);
    setSelectedUserId(user.id);
    setShowUserSuggestions(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!projectId) return;

    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await removeMember.mutateAsync({ projectId, userId });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!projectId) return;

    try {
      await updateRole.mutateAsync({ projectId, userId, role });
      setEditingMemberId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">Manage who can access this project</p>
        </div>
        {canManage && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Enter an email address to add a user to this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={emailInput}
                      onChange={(e) => handleEmailInputChange(e.target.value)}
                      onFocus={() => setShowUserSuggestions(emailInput.length >= 2 && filteredUserSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}
                      className="w-full"
                    />
                    {showUserSuggestions && filteredUserSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredUserSuggestions.map((user: any) => (
                          <div
                            key={user.id}
                            className="px-4 py-2 hover:bg-accent cursor-pointer flex items-center gap-2"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectUser(user);
                            }}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{user.name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {availableUsers.length > 0 
                      ? `${availableUsers.length} workspace member${availableUsers.length !== 1 ? 's' : ''} available`
                      : 'Type an email address to add a user'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <role.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAddMember} 
                  className="w-full"
                  disabled={!emailInput.trim() && !selectedUserId}
                >
                  Add Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{members.length} Team Member{members.length !== 1 ? 's' : ''}</CardTitle>
          <CardDescription>
            {members.length === 0 
              ? 'No members yet. Add team members to collaborate on this project.'
              : 'Project members and their roles'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No members added yet</p>
              {canManage && (
                <Button onClick={() => setIsInviteOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member: any) => {
                const roleInfo = getRoleInfo(member.role);
                const isCreator = projectCreatorId && (member.userId === projectCreatorId || String(member.userId) === String(projectCreatorId));
                const isEditing = editingMemberId === member.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{member.user?.name || 'Unknown User'}</div>
                          {isCreator && (
                            <Badge variant="outline" className="text-xs">
                              Creator
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user?.email || 'No email'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isEditing ? (
                        <Select
                          value={member.role}
                          onValueChange={(role) => handleUpdateRole(member.userId, role)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <Badge className={roleInfo.color}>
                            <roleInfo.icon className="h-3 w-3 mr-1" />
                            {roleInfo.label}
                          </Badge>
                          {canManage && !isCreator && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMemberId(member.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.userId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

