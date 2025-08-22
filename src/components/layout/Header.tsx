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
import {
    Bell,
    Briefcase,
    CheckSquare,
    LogOut,
    Menu,
    PlusCircle,
    Search,
    StickyNote,
    User
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface HeaderProps {
  toggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const { setOpen, open } = useSidebar();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample notifications
  const notifications = [
    { id: 1, title: "Project assigned", description: "You've been assigned to Website Redesign project", time: "5 minutes ago" },
    { id: 2, title: "New task created", description: "New task 'Create mockup' was created", time: "1 hour ago" },
    { id: 3, title: "Meeting reminder", description: "Team standup in 30 minutes", time: "25 minutes ago" }
  ];
  
  // Use setOpen to toggle the sidebar state
  const toggleSidebar = () => {
    setOpen(!open);
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
      default:
        break;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for "${searchQuery}"`);
      // navigate(`/search?q=${searchQuery}`); // Optional: navigate to a search results page
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 flex h-16 items-center px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4 w-full">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </form>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Menu */}
          <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create
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
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{notification.time}</div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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
    </header>
  );
};

export default Header;
