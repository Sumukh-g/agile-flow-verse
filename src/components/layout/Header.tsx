/**
 * Header Component
 * 
 * Responsive header with hamburger menu for mobile sidebar toggle.
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth-context';
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications';
import {
  Bell,
  Briefcase,
  CheckSquare,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  PlusCircle,
  Search,
  StickyNote,
  User,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface HeaderProps {
  toggleMobileSidebar: () => void;
  toggleDesktopSidebar: () => void;
  isMobileSidebarOpen: boolean;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  toggleMobileSidebar, 
  isMobileSidebarOpen,
}) => {
  const { open, setOpen } = useSidebar();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Real notifications from the API (most recent 5) + unread badge count.
  const { data: notificationsData } = useNotifications({ limit: 5 });
  const { data: unreadData } = useUnreadCount();
  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = unreadData?.count ?? 0;

  const formatRelativeTime = (value: Date | string): string => {
    const date = value instanceof Date ? value : new Date(value);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleCreateItem = (type: string) => {
    setCreateMenuOpen(false);
    switch (type) {
      case 'task':
        toast.info('Creating new task');
        navigate('/tasks');
        break;
      case 'project':
        toast.info('Creating new project');
        navigate('/projects');
        break;
      case 'note':
        toast.info('Creating new note');
        navigate('/notes');
        break;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for "${searchQuery}"`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full">
        
        {/* Mobile Menu Toggle - Only visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 md:hidden"
          onClick={toggleMobileSidebar}
          aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {/* Desktop Sidebar Toggle - Only visible on desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 hidden md:flex"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
        </Button>

        {/* Mobile Logo */}
        <Link to="/dashboard" className="font-bold text-lg text-primary flex-shrink-0 md:hidden">
          AgileFlow
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:block flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </form>
        </div>

        {/* Spacer for mobile */}
        <div className="flex-1 md:hidden" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 md:hidden"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Create Menu */}
          <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="flex-shrink-0 md:hidden">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex flex-shrink-0">
                <PlusCircle className="h-4 w-4 mr-2" />
                <span>Create</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCreateItem('project')}>
                <Briefcase className="h-4 w-4 mr-2" />
                Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateItem('task')}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateItem('note')}>
                <StickyNote className="h-4 w-4 mr-2" />
                Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative flex-shrink-0">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  You're all caught up.
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3"
                    onClick={() => navigate('/notifications')}
                  >
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs text-muted-foreground">{notification.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/notifications')} className="justify-center text-sm">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <User className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      {mobileSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b p-3 z-20 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;
