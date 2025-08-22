import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Check,
    Copy,
    Edit,
    Eye,
    Globe,
    Lock,
    Settings,
    Trash2
} from 'lucide-react';
import React, { useState } from 'react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  pageId: string;
  onShare: (email: string, permission: string) => void;
  onCopyLink: () => void;
  onMakePublic: () => void;
  onMakePrivate: () => void;
}

interface Collaborator {
  id: string;
  email: string;
  name: string;
  permission: 'view' | 'edit' | 'admin';
  avatar?: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  pageTitle,
  pageId,
  onShare,
  onCopyLink,
  onMakePublic,
  onMakePrivate
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState(`https://app.example.com/share/${pageId}`);
  const [copied, setCopied] = useState(false);

  // Mock collaborators data
  const [collaborators] = useState<Collaborator[]>([
    {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      permission: 'edit',
      avatar: ''
    },
    {
      id: '2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      permission: 'view',
      avatar: ''
    }
  ]);

  const handleShare = () => {
    if (email.trim()) {
      onShare(email, permission);
      setEmail('');
      setPermission('view');
    }
  };

  const handleCopyLink = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = () => {
    setIsPublic(!isPublic);
    if (!isPublic) {
      onMakePublic();
    } else {
      onMakePrivate();
    }
  };

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case 'view': return <Eye className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case 'view': return 'bg-blue-100 text-blue-800';
      case 'edit': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{pageTitle}"</DialogTitle>
          <DialogDescription>
            Share this page with others or make it public.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Public/Private toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <p className="font-medium">
                  {isPublic ? 'Public' : 'Private'}
                </p>
                <p className="text-sm text-gray-500">
                  {isPublic 
                    ? 'Anyone with the link can view' 
                    : 'Only people you invite can view'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublic}
            >
              {isPublic ? 'Make private' : 'Make public'}
            </Button>
          </div>

          {/* Share link */}
          <div className="space-y-2">
            <Label>Link</Label>
            <div className="flex space-x-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Invite people */}
          <div className="space-y-2">
            <Label>Invite people</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Can view</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleShare}
                disabled={!email.trim()}
              >
                Invite
              </Button>
            </div>
          </div>

          {/* Collaborators list */}
          {collaborators.length > 0 && (
            <div className="space-y-2">
              <Label>People with access</Label>
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {collaborator.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{collaborator.name}</p>
                        <p className="text-xs text-gray-500">{collaborator.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPermissionColor(collaborator.permission)}>
                        {collaborator.permission}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Change permission
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog; 