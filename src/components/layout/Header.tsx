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
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface HeaderProps {
  toggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const { setOpen, open } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
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
  
  useEffect(() => {
    // Check if user is logged in
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
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

        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="bg-indigo-600 text-white p-1 rounded">PM</div>
          <span className="hidden md:inline">ProjectMaster</span>
        </Link>

        <form onSubmit={handleSearch} className="relative hidden md:flex flex-1 max-w-md mx-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 w-full bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="flex items-center ml-auto gap-1 md:gap-2">
          {/* Mobile search button - consider making this open a modal or an input field */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon" className="text-slate-500 md:hidden">
                 <Search className="h-5 w-5" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-2 md:hidden">
              <form onSubmit={handleSearch} className="flex w-full">
                 <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full bg-slate-50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="sm" className="ml-2">Search</Button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-500">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCreateItem('task')}>
                <CheckSquare className="mr-2 h-4 w-4" /> Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateItem('project')}>
                <Briefcase className="mr-2 h-4 w-4" /> Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateItem('note')}>
                <StickyNote className="mr-2 h-4 w-4" /> Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-500 relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => toast.info("Marked all as read (mock)")}>
                      Mark all as read
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/notifications')}>
                    View All
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? notifications.slice(0, 3).map(notification => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-2 cursor-pointer hover:bg-slate-50" onClick={() => toast.info(`Notification: ${notification.title}`)}>
                  <div className="font-medium text-sm">{notification.title}</div>
                  <div className="text-muted-foreground text-xs">{notification.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{notification.time}</div>
                </DropdownMenuItem>
              )) : (
                <DropdownMenuItem disabled className="text-center text-sm text-muted-foreground py-4">No new notifications</DropdownMenuItem>
              )}
              {notifications.length > 3 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-sm cursor-pointer hover:bg-slate-50" onClick={() => navigate('/notifications')}>
                    View all notifications ({notifications.length})
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-sm cursor-pointer hover:bg-slate-50" onClick={() => navigate('/notifications')}>
                Open Notifications Center
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {user?.name ? (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/custom-dashboard')}>My Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Navigating to Profile (mock)")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Navigating to Settings (mock)")}>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Navigating to Help (mock)")}>Help</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:!bg-red-50 hover:!text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate('/login')}>Log in</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/signup')}>Sign up</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
