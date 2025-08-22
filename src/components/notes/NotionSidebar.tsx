import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Activity,
    Brain,
    Calendar,
    ChevronDown,
    ChevronRight,
    Database,
    Edit,
    Eye,
    FileText,
    Folder,
    FormInput,
    Kanban,
    Lock,
    Moon,
    MoreHorizontal,
    Palette,
    Plus,
    Presentation,
    Search,
    Settings,
    Share2,
    Star,
    Sun,
    Trash2,
    Users,
    Workflow
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface NotionPage {
  id: string;
  title: string;
  type: 'page' | 'folder' | 'database' | 'calendar' | 'kanban' | 'timeline' | 'mindmap' | 'whiteboard' | 'presentation' | 'form' | 'workflow';
  icon?: string;
  parentId?: string;
  children?: string[];
  isExpanded?: boolean;
  isStarred?: boolean;
  isShared?: boolean;
  isPublic?: boolean;
  collaborators?: string[];
  lastEdited?: Date;
  color?: string;
  properties?: Record<string, any>;
}

interface NotionSidebarProps {
  pages: NotionPage[];
  activePage: NotionPage | null;
  onPageSelect: (page: NotionPage) => void;
  onCreatePage: (parentId?: string) => void;
  onToggleStar: (pageId: string) => void;
  onSharePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, newTitle: string) => void;
}

const NotionSidebar: React.FC<NotionSidebarProps> = ({
  pages,
  activePage,
  onPageSelect,
  onCreatePage,
  onToggleStar,
  onSharePage,
  onDeletePage,
  onRenamePage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  // Build hierarchical structure
  const pageTree = useMemo(() => {
    const pageMap = new Map<string, NotionPage>();
    const rootPages: NotionPage[] = [];

    pages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    pages.forEach(page => {
      if (page.parentId && pageMap.has(page.parentId)) {
        const parent = pageMap.get(page.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(page.id);
      } else {
        rootPages.push(pageMap.get(page.id)!);
      }
    });

    return { pageMap, rootPages };
  }, [pages]);

  // Filter pages based on search
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pageTree.rootPages;

    const searchLower = searchQuery.toLowerCase();
    const matchingPages = pages.filter(page =>
      page.title.toLowerCase().includes(searchLower)
    );

    const matchingIds = new Set(matchingPages.map(p => p.id));
    const ancestors = new Set<string>();

    // Find all ancestors of matching pages
    matchingPages.forEach(page => {
      let current = page.parentId;
      while (current) {
        ancestors.add(current);
        current = pages.find(p => p.id === current)?.parentId;
      }
    });

    return pageTree.rootPages.filter(page => 
      matchingIds.has(page.id) || ancestors.has(page.id)
    );
  }, [pageTree.rootPages, pages, searchQuery]);

  const toggleExpanded = (pageId: string) => {
    setExpandedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

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

  const renderPageItem = (page: NotionPage, depth: number = 0) => {
    const isExpanded = expandedPages.has(page.id);
    const hasChildren = page.children && page.children.length > 0;
    const isActive = activePage?.id === page.id;

    return (
      <div key={page.id}>
        <div
          className={`flex items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            isActive ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onPageSelect(page)}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(page.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Page icon */}
          <div className="mr-2 text-gray-500">
            {getPageIcon(page.type)}
          </div>

          {/* Page title */}
          <span className="flex-1 truncate text-sm font-medium">
            {page.title}
          </span>

          {/* Page indicators */}
          <div className="flex items-center space-x-1">
            {page.isStarred && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
            {page.isShared && (
              <Users className="h-3 w-3 text-blue-500" />
            )}
            {page.isPublic && (
              <Eye className="h-3 w-3 text-green-500" />
            )}
            {page.passwordProtected && (
              <Lock className="h-3 w-3 text-red-500" />
            )}
          </div>

          {/* Page actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onToggleStar(page.id)}>
                <Star className="h-4 w-4 mr-2" />
                {page.isStarred ? 'Remove from favorites' : 'Add to favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSharePage(page.id)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRenamePage(page.id, page.title)}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreatePage(page.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add subpage
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDeletePage(page.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div>
            {page.children!.map(childId => {
              const childPage = pageTree.pageMap.get(childId);
              return childPage ? renderPageItem(childPage, depth + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-r bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Manage members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Quick actions */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => onCreatePage()}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            New page
          </Button>
        </div>
      </div>

      {/* Pages tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredPages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No pages found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPages.map(page => renderPageItem(page))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{pages.length} pages</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default NotionSidebar; 