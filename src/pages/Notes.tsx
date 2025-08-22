import { Button } from '@/components/ui/button';
import {
    AlertCircle,
    FileText,
    Plus
} from 'lucide-react';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Lazy load components for extreme performance optimization
const NotionEditor = lazy(() => import('@/components/notes/NotionEditor'));
const NotionSidebar = lazy(() => import('@/components/notes/NotionSidebar'));
const NotionHeader = lazy(() => import('@/components/notes/NotionHeader'));
const ShareDialog = lazy(() => import('@/components/notes/ShareDialog'));
const NoteDatabase = lazy(() => import('@/components/notes/NoteDatabase'));
const NoteCalendar = lazy(() => import('@/components/notes/NoteCalendar'));
const NoteKanban = lazy(() => import('@/components/notes/NoteKanban'));
const NoteTimeline = lazy(() => import('@/components/notes/NoteTimeline'));
const NoteMindmap = lazy(() => import('@/components/notes/NoteMindmap'));
const NoteWhiteboard = lazy(() => import('@/components/notes/NoteWhiteboard'));
const NotePresentation = lazy(() => import('@/components/notes/NotePresentation'));
const NoteForms = lazy(() => import('@/components/notes/NoteForms'));
const NoteWorkflows = lazy(() => import('@/components/notes/NoteWorkflows'));

// Types
interface NotionPage {
  id: string;
  title: string;
  type: 'page' | 'folder' | 'database' | 'calendar' | 'kanban' | 'timeline' | 'mindmap' | 'whiteboard' | 'presentation' | 'form' | 'workflow';
  content: string;
  parentId?: string;
  children?: string[];
  isStarred?: boolean;
  isShared?: boolean;
  isPublic?: boolean;
  collaborators?: string[];
  lastEdited?: Date;
  color?: string;
  properties?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface BreadcrumbItem {
  id: string;
  title: string;
  type: string;
}

const Notes: React.FC = () => {
  // State management with extreme efficiency
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [activePage, setActivePage] = useState<NotionPage | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Memoized breadcrumbs for performance
  const breadcrumbs = useMemo(() => {
    const breadcrumbItems: BreadcrumbItem[] = [];
    let currentPage = activePage;

    while (currentPage) {
      breadcrumbItems.unshift({
        id: currentPage.id,
        title: currentPage.title,
        type: currentPage.type
      });
      
      if (currentPage.parentId) {
        currentPage = pages.find(p => p.id === currentPage.parentId) || null;
      } else {
        break;
      }
    }

    return breadcrumbItems;
  }, [activePage, pages]);

  // Load pages from localStorage on mount
  useEffect(() => {
    const loadPages = () => {
      try {
        const savedPages = localStorage.getItem('notion-pages');
        if (savedPages) {
          const parsedPages = JSON.parse(savedPages);
          const processedPages = parsedPages.map((page: any) => ({
            ...page,
            createdAt: new Date(page.createdAt),
            updatedAt: new Date(page.updatedAt),
            lastEdited: page.lastEdited ? new Date(page.lastEdited) : undefined
          }));
          setPages(processedPages);
          
          // Set first page as active if none selected
          if (processedPages.length > 0 && !activePage) {
            setActivePage(processedPages[0]);
          }
        } else {
          // Create default workspace structure
          const defaultPages: NotionPage[] = [
            {
              id: 'workspace',
              title: 'My Workspace',
              type: 'folder',
              content: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              children: ['getting-started']
            },
            {
              id: 'getting-started',
              title: 'Getting Started',
              type: 'page',
              content: '# Welcome to Your Workspace\n\nThis is your personal workspace where you can create, organize, and collaborate on pages.\n\n## Quick Start\n- Click the "+" button to create a new page\n- Use folders to organize your content\n- Share pages with others\n- Star important pages for quick access',
              parentId: 'workspace',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          setPages(defaultPages);
          setActivePage(defaultPages[1]);
        }
      } catch (error) {
        setError('Failed to load pages');
        console.error('Error loading pages:', error);
      }
    };

    loadPages();
  }, []);

  // Save pages to localStorage when they change
  useEffect(() => {
    if (pages.length > 0) {
      localStorage.setItem('notion-pages', JSON.stringify(pages));
    }
  }, [pages]);

  // Handlers
  const handleCreatePage = useCallback((parentId?: string, type: NotionPage['type'] = 'page') => {
    const newPage: NotionPage = {
      id: `page_${Date.now()}`,
      title: 'Untitled',
      type,
      content: type === 'page' ? '' : JSON.stringify({}),
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEdited: new Date()
    };

    setPages(prev => {
      const updatedPages = [...prev, newPage];
      
      // Update parent's children array
      if (parentId) {
        const parentIndex = updatedPages.findIndex(p => p.id === parentId);
        if (parentIndex !== -1) {
          updatedPages[parentIndex] = {
            ...updatedPages[parentIndex],
            children: [...(updatedPages[parentIndex].children || []), newPage.id]
          };
        }
      }
      
      return updatedPages;
    });

    setActivePage(newPage);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created`);
  }, []);

  const handlePageSelect = useCallback((page: NotionPage) => {
    setActivePage(page);
  }, []);

  const handleUpdatePage = useCallback((pageId: string, updates: Partial<NotionPage>) => {
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, ...updates, updatedAt: new Date(), lastEdited: new Date() }
        : page
    ));
  }, []);

  const handleToggleStar = useCallback((pageId: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, isStarred: !page.isStarred, updatedAt: new Date() }
        : page
    ));
  }, []);

  const handleSharePage = useCallback((pageId: string) => {
    setShowShareDialog(true);
  }, []);

  const handleDeletePage = useCallback((pageId: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      setPages(prev => {
        const updatedPages = prev.filter(page => page.id !== pageId);
        
        // Remove from parent's children array
        const deletedPage = prev.find(p => p.id === pageId);
        if (deletedPage?.parentId) {
          const parentIndex = updatedPages.findIndex(p => p.id === deletedPage.parentId);
          if (parentIndex !== -1) {
            updatedPages[parentIndex] = {
              ...updatedPages[parentIndex],
              children: updatedPages[parentIndex].children?.filter(id => id !== pageId) || []
            };
          }
        }
        
        return updatedPages;
      });

      if (activePage?.id === pageId) {
        const remainingPages = pages.filter(p => p.id !== pageId);
        setActivePage(remainingPages.length > 0 ? remainingPages[0] : null);
      }

      toast.success('Page deleted');
    }
  }, [activePage, pages]);

  const handleRenamePage = useCallback((pageId: string, newTitle: string) => {
    handleUpdatePage(pageId, { title: newTitle });
    toast.success('Page renamed');
  }, [handleUpdatePage]);

  const handleNavigateToParent = useCallback((parentId: string) => {
    const parentPage = pages.find(p => p.id === parentId);
    if (parentPage) {
      setActivePage(parentPage);
    }
  }, [pages]);

  const handleShare = useCallback((email: string, permission: string) => {
    toast.success(`Invitation sent to ${email}`);
  }, []);

  const handleCopyLink = useCallback(() => {
    if (activePage) {
      navigator.clipboard.writeText(`https://app.example.com/share/${activePage.id}`);
      toast.success('Link copied to clipboard');
    }
  }, [activePage]);

  const handleMakePublic = useCallback(() => {
    if (activePage) {
      handleUpdatePage(activePage.id, { isPublic: true });
      toast.success('Page made public');
    }
  }, [activePage, handleUpdatePage]);

  const handleMakePrivate = useCallback(() => {
    if (activePage) {
      handleUpdatePage(activePage.id, { isPublic: false });
      toast.success('Page made private');
    }
  }, [activePage, handleUpdatePage]);

  // Loading and error components
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center p-8 text-red-600">
      <AlertCircle className="w-5 h-5 mr-2" />
      {message}
    </div>
  );

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notion Sidebar */}
        <Suspense fallback={<LoadingSpinner />}>
          <NotionSidebar
            pages={pages}
            activePage={activePage}
            onPageSelect={handlePageSelect}
            onCreatePage={handleCreatePage}
            onToggleStar={handleToggleStar}
            onSharePage={handleSharePage}
            onDeletePage={handleDeletePage}
            onRenamePage={handleRenamePage}
          />
        </Suspense>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Notion Header */}
          <Suspense fallback={<LoadingSpinner />}>
            <NotionHeader
              page={activePage}
              breadcrumbs={breadcrumbs}
              onTitleChange={(newTitle) => activePage && handleRenamePage(activePage.id, newTitle)}
              onToggleStar={() => activePage && handleToggleStar(activePage.id)}
              onShare={() => activePage && handleSharePage(activePage.id)}
              onDelete={() => activePage && handleDeletePage(activePage.id)}
              onDuplicate={() => activePage && handleCreatePage(activePage.parentId, activePage.type)}
              onExport={() => toast.info('Export feature coming soon')}
              onViewHistory={() => toast.info('History feature coming soon')}
              onNavigateToParent={handleNavigateToParent}
            />
          </Suspense>

          {/* Editor */}
          <div className="flex-1 overflow-auto">
            {activePage ? (
              <Suspense fallback={<LoadingSpinner />}>
                {activePage.type === 'page' && (
                  <NotionEditor
                    page={activePage}
                    onUpdatePage={handleUpdatePage}
                  />
                )}
                {activePage.type === 'database' && (
                  <NoteDatabase
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'calendar' && (
                  <NoteCalendar
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'kanban' && (
                  <NoteKanban
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'timeline' && (
                  <NoteTimeline
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'mindmap' && (
                  <NoteMindmap
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'whiteboard' && (
                  <NoteWhiteboard
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'presentation' && (
                  <NotePresentation
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'form' && (
                  <NoteForms
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {activePage.type === 'workflow' && (
                  <NoteWorkflows
                    note={activePage}
                    onUpdateNote={(pageId, updates) => handleUpdatePage(pageId, updates)}
                  />
                )}
                {(activePage.type === 'folder' || activePage.type === 'database' || 
                  activePage.type === 'calendar' || activePage.type === 'kanban' || 
                  activePage.type === 'timeline' || activePage.type === 'mindmap' || 
                  activePage.type === 'whiteboard' || activePage.type === 'presentation' || 
                  activePage.type === 'form' || activePage.type === 'workflow') && (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium mb-2">{activePage.title}</h3>
                    <p className="text-sm mb-4">This is a {activePage.type} page</p>
                    <Button onClick={() => handleCreatePage(activePage.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add content
                    </Button>
                  </div>
                )}
              </Suspense>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Welcome to your workspace</h3>
                  <p className="text-sm mb-4">Create your first page to get started</p>
                  <Button onClick={() => handleCreatePage()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create page
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Suspense fallback={<LoadingSpinner />}>
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          pageTitle={activePage?.title || ''}
          pageId={activePage?.id || ''}
          onShare={handleShare}
          onCopyLink={handleCopyLink}
          onMakePublic={handleMakePublic}
          onMakePrivate={handleMakePrivate}
        />
      </Suspense>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default Notes;
