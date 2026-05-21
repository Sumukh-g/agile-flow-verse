/**
 * Global Search Command Palette
 * 
 * A powerful command palette (Cmd+K / Ctrl+K) for quick navigation and search.
 * 
 * Features:
 * - Global keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows/Linux)
 * - Search across tasks, projects, notes, and issues
 * - Recent searches history
 * - Quick actions (create task, go to project, etc.)
 * - Fuzzy matching for better search results
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Search result highlighting
 * - Grouped results by type
 * 
 * @component
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  FolderKanban,
  StickyNote,
  AlertCircle,
  Plus,
  Clock,
  Star,
  User,
  Settings,
  Calendar,
  Zap,
  LayoutDashboard,
  ListTodo,
  Columns,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Search result item interface
 */
interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'note' | 'issue' | 'action';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  projectName?: string;
  url?: string;
  icon?: React.ElementType;
  action?: () => void;
}

/**
 * Recent search interface
 */
interface RecentSearch {
  query: string;
  timestamp: number;
}

// Local storage key for recent searches
const RECENT_SEARCHES_KEY = 'global-search-recent';

// Maximum number of recent searches to store
const MAX_RECENT_SEARCHES = 5;

/**
 * Global Search Component
 * 
 * Renders a command palette dialog with search functionality.
 * Can be triggered by keyboard shortcut or programmatically.
 * 
 * @param open - Optional controlled open state
 * @param onOpenChange - Optional callback when open state changes
 */
export function GlobalSearch({ 
  open: controlledOpen, 
  onOpenChange 
}: { 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
} = {}) {
  // State for dialog open/close
  const [open, setOpen] = useState(controlledOpen ?? false);
  
  // State for search query
  const [query, setQuery] = useState('');
  
  // State for recent searches
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  // Navigation hook
  const navigate = useNavigate();
  
  // Ref for input focus management
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync controlled state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  /**
   * Save a search query to recent searches
   */
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((s) => s.query !== searchQuery);
      // Add new search at the beginning
      const updated = [{ query: searchQuery, timestamp: Date.now() }, ...filtered];
      // Keep only the most recent searches
      const limited = updated.slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
      
      return limited;
    });
  }, []);

  /**
   * Clear all recent searches
   */
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
    toast.success('Recent searches cleared');
  }, []);

  /**
   * Handle keyboard shortcut (Cmd+K / Ctrl+K)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        onOpenChange?.(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  /**
   * Handle dialog open state change
   */
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      // Clear query when closing
      setQuery('');
    }
  }, [onOpenChange]);

  /**
   * Fetch search results from API
   * Uses debounced query for better performance
   */
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query.trim()) return { tasks: [], projects: [], notes: [], issues: [] };
      
      try {
        const response = await apiClient.get('/v1/search', {
          params: {
            q: query,
            limit: 10,
          },
        });
        return response.data;
      } catch (error) {
        console.error('Search failed:', error);
        return { tasks: [], projects: [], notes: [], issues: [] };
      }
    },
    enabled: query.length > 0,
    staleTime: 30000,
  });

  /**
   * Quick actions available in the command palette
   */
  const quickActions: SearchResult[] = useMemo(() => [
    {
      id: 'action-create-task',
      type: 'action' as const,
      title: 'Create New Task',
      description: 'Add a new task to a project',
      icon: Plus,
      action: () => {
        navigate('/tasks?action=create');
        handleOpenChange(false);
      },
    },
    {
      id: 'action-create-project',
      type: 'action' as const,
      title: 'Create New Project',
      description: 'Start a new project',
      icon: FolderKanban,
      action: () => {
        navigate('/projects?action=create');
        handleOpenChange(false);
      },
    },
    {
      id: 'action-dashboard',
      type: 'action' as const,
      title: 'Go to Dashboard',
      description: 'View your dashboard',
      icon: LayoutDashboard,
      action: () => {
        navigate('/dashboard');
        handleOpenChange(false);
      },
    },
    {
      id: 'action-tasks',
      type: 'action' as const,
      title: 'View All Tasks',
      description: 'Browse all your tasks',
      icon: ListTodo,
      action: () => {
        navigate('/tasks');
        handleOpenChange(false);
      },
    },
    {
      id: 'action-kanban',
      type: 'action' as const,
      title: 'Open Kanban Boards',
      description: 'View kanban boards',
      icon: Columns,
      action: () => {
        navigate('/boards');
        handleOpenChange(false);
      },
    },
    {
      id: 'action-calendar',
      type: 'action' as const,
      title: 'Open Calendar',
      description: 'View your calendar',
      icon: Calendar,
      action: () => {
        navigate('/calendar');
        handleOpenChange(false);
      },
    },
    {
      id: 'action-settings',
      type: 'action' as const,
      title: 'Go to Settings',
      description: 'Manage your settings',
      icon: Settings,
      action: () => {
        navigate('/settings');
        handleOpenChange(false);
      },
    },
    {
      id: 'action-automations',
      type: 'action' as const,
      title: 'Workflow Automations',
      description: 'Configure automations',
      icon: Zap,
      action: () => {
        navigate('/automations');
        handleOpenChange(false);
      },
    },
  ], [navigate, handleOpenChange]);

  /**
   * Handle selecting a search result or action
   */
  const handleSelect = useCallback((item: SearchResult) => {
    // Save to recent searches if it's a search result
    if (item.type !== 'action') {
      saveRecentSearch(item.title);
    }
    
    // Execute action if available
    if (item.action) {
      item.action();
      return;
    }
    
    // Navigate based on type
    switch (item.type) {
      case 'task':
        navigate(`/tasks?task=${item.id}`);
        break;
      case 'project':
        navigate(`/projects/${item.id}`);
        break;
      case 'note':
        navigate(`/notes?note=${item.id}`);
        break;
      case 'issue':
        navigate(`/issues?issue=${item.id}`);
        break;
    }
    
    handleOpenChange(false);
  }, [navigate, handleOpenChange, saveRecentSearch]);

  /**
   * Get icon for result type
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return FileText;
      case 'project':
        return FolderKanban;
      case 'note':
        return StickyNote;
      case 'issue':
        return AlertCircle;
      default:
        return Search;
    }
  };

  /**
   * Get badge color for status
   */
  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  /**
   * Highlight matching text in search results
   */
  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Transform API results to SearchResult format
  const formattedResults: SearchResult[] = useMemo(() => {
    if (!searchResults) return [];
    
    const results: SearchResult[] = [];
    
    // Add tasks
    if (searchResults.tasks?.length > 0) {
      searchResults.tasks.forEach((task: any) => {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          projectName: task.project?.name,
        });
      });
    }
    
    // Add projects
    if (searchResults.projects?.length > 0) {
      searchResults.projects.forEach((project: any) => {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          description: project.description,
        });
      });
    }
    
    // Add notes
    if (searchResults.notes?.length > 0) {
      searchResults.notes.forEach((note: any) => {
        results.push({
          id: note.id,
          type: 'note',
          title: note.title,
          description: note.content?.substring(0, 100),
        });
      });
    }
    
    // Add issues
    if (searchResults.issues?.length > 0) {
      searchResults.issues.forEach((issue: any) => {
        results.push({
          id: issue.id,
          type: 'issue',
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
        });
      });
    }
    
    return results;
  }, [searchResults]);

  // Filter quick actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    
    const lowerQuery = query.toLowerCase();
    return quickActions.filter(
      (action) =>
        action.title.toLowerCase().includes(lowerQuery) ||
        action.description?.toLowerCase().includes(lowerQuery)
    );
  }, [query, quickActions]);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      {/* Search Input */}
      <CommandInput
        ref={inputRef}
        placeholder="Search tasks, projects, notes... or type a command"
        value={query}
        onValueChange={setQuery}
      />
      
      <CommandList>
        {/* Loading State */}
        {isLoading && query && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-4 w-4 animate-pulse mx-auto mb-2" />
            Searching...
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && query && formattedResults.length === 0 && filteredActions.length === 0 && (
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching with different keywords
              </p>
            </div>
          </CommandEmpty>
        )}
        
        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((recent) => (
              <CommandItem
                key={recent.timestamp}
                onSelect={() => setQuery(recent.query)}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{recent.query}</span>
              </CommandItem>
            ))}
            <CommandItem
              onSelect={clearRecentSearches}
              className="text-muted-foreground text-xs justify-center"
            >
              Clear recent searches
            </CommandItem>
          </CommandGroup>
        )}
        
        {/* Search Results */}
        {formattedResults.length > 0 && (
          <>
            {/* Tasks */}
            {formattedResults.filter((r) => r.type === 'task').length > 0 && (
              <CommandGroup heading="Tasks">
                {formattedResults
                  .filter((r) => r.type === 'task')
                  .map((result) => {
                    const Icon = getTypeIcon(result.type);
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 py-3"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {highlightMatch(result.title, query)}
                            </span>
                            {result.status && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusBadgeClass(result.status)}`}
                              >
                                {result.status}
                              </Badge>
                            )}
                          </div>
                          {result.projectName && (
                            <span className="text-xs text-muted-foreground">
                              in {result.projectName}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            )}
            
            {/* Projects */}
            {formattedResults.filter((r) => r.type === 'project').length > 0 && (
              <CommandGroup heading="Projects">
                {formattedResults
                  .filter((r) => r.type === 'project')
                  .map((result) => {
                    const Icon = getTypeIcon(result.type);
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 py-3"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">
                            {highlightMatch(result.title, query)}
                          </span>
                          {result.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            )}
            
            {/* Notes */}
            {formattedResults.filter((r) => r.type === 'note').length > 0 && (
              <CommandGroup heading="Notes">
                {formattedResults
                  .filter((r) => r.type === 'note')
                  .map((result) => {
                    const Icon = getTypeIcon(result.type);
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 py-3"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">
                            {highlightMatch(result.title, query)}
                          </span>
                          {result.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            )}
            
            {/* Issues */}
            {formattedResults.filter((r) => r.type === 'issue').length > 0 && (
              <CommandGroup heading="Issues">
                {formattedResults
                  .filter((r) => r.type === 'issue')
                  .map((result) => {
                    const Icon = getTypeIcon(result.type);
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 py-3"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {highlightMatch(result.title, query)}
                            </span>
                            {result.status && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusBadgeClass(result.status)}`}
                              >
                                {result.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            )}
            
            <CommandSeparator />
          </>
        )}
        
        {/* Quick Actions */}
        {filteredActions.length > 0 && (
          <CommandGroup heading="Quick Actions">
            {filteredActions.map((action) => {
              const Icon = action.icon || Zap;
              return (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="flex items-center gap-3 py-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{action.title}</span>
                    {action.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {action.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {/* Keyboard Hints */}
        <div className="px-4 py-2 border-t text-xs text-muted-foreground flex justify-between items-center">
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↑↓</kbd> Navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> Select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd> Close
          </span>
        </div>
      </CommandList>
    </CommandDialog>
  );
}

export default GlobalSearch;

