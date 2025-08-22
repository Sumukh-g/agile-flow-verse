import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Activity,
    Brain,
    Calendar,
    ChevronRight,
    Copy,
    Database,
    Download,
    Edit,
    FileText,
    Folder,
    FormInput,
    Globe,
    History,
    Kanban,
    Lock,
    MoreHorizontal,
    Palette,
    Presentation,
    Share2,
    Star,
    Trash2,
    Users,
    Workflow
} from 'lucide-react';
import React, { useState } from 'react';

interface NotionPage {
  id: string;
  title: string;
  type: 'page' | 'folder' | 'database' | 'calendar' | 'kanban' | 'timeline' | 'mindmap' | 'whiteboard' | 'presentation' | 'form' | 'workflow';
  parentId?: string;
  isStarred?: boolean;
  isShared?: boolean;
  isPublic?: boolean;
  collaborators?: string[];
  lastEdited?: Date;
}

interface BreadcrumbItem {
  id: string;
  title: string;
  type: string;
}

interface NotionHeaderProps {
  page: NotionPage | null;
  breadcrumbs: BreadcrumbItem[];
  onTitleChange: (newTitle: string) => void;
  onToggleStar: () => void;
  onShare: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onViewHistory: () => void;
  onNavigateToParent: (parentId: string) => void;
}

const NotionHeader: React.FC<NotionHeaderProps> = ({
  page,
  breadcrumbs,
  onTitleChange,
  onToggleStar,
  onShare,
  onDelete,
  onDuplicate,
  onExport,
  onViewHistory,
  onNavigateToParent
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(page?.title || '');

  const getPageIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'kanban': return <Kanban className="h-4 w-4" />;
      case 'timeline': return <Activity className="h-4 w-4" />;
      case 'mindmap': return <Brain className="h-4 w-4" />;
      case 'whiteboard': return <Palette className="h-4 w-4" />;
      case 'presentation': return <Presentation className="h-4 w-4" />;
      case 'form': return <FormInput className="h-4 w-4" />;
      case 'workflow': return <Workflow className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== page?.title) {
      onTitleChange(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleValue(page?.title || '');
      setIsEditingTitle(false);
    }
  };

  if (!page) {
    return (
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-500">
            <FileText className="h-5 w-5" />
            <span className="text-lg font-medium">No page selected</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-white dark:bg-gray-800 p-4">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <button
              onClick={() => onNavigateToParent(item.id)}
              className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {getPageIcon(item.type)}
              <span>{item.title}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Page icon */}
          <div className="text-gray-500">
            {getPageIcon(page.type)}
          </div>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-lg font-medium border-0 p-0 focus:ring-0"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors text-left w-full"
              >
                {page.title}
              </button>
            )}
          </div>

          {/* Page indicators */}
          <div className="flex items-center space-x-2">
            {page.isStarred && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
            {page.isShared && (
              <Users className="h-4 w-4 text-blue-500" />
            )}
            {page.isPublic ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleStar}
          >
            <Star className={`h-4 w-4 ${page.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewHistory}>
                <History className="h-4 w-4 mr-2" />
                View history
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page metadata */}
      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
        {page.lastEdited && (
          <span>Last edited {page.lastEdited.toLocaleDateString()}</span>
        )}
        {page.collaborators && page.collaborators.length > 0 && (
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{page.collaborators.length} collaborators</span>
          </div>
        )}
        <Badge variant="outline" className="text-xs">
          {page.type}
        </Badge>
      </div>
    </div>
  );
};

export default NotionHeader; 