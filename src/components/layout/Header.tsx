
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Bell, 
  User,
  Menu
} from 'lucide-react';
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

interface HeaderProps {
  toggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const { toggle: toggleSidebar } = useSidebar();

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

        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="bg-indigo-600 text-white p-1 rounded">PM</div>
          <span className="hidden md:inline">ProjectMaster</span>
        </Link>

        <div className="relative hidden md:flex flex-1 max-w-md mx-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 w-full bg-slate-50"
          />
        </div>

        <div className="flex items-center ml-auto gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="text-slate-500">
            <Search className="h-5 w-5 md:hidden" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-slate-500">
            <PlusCircle className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-slate-500 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Help</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
