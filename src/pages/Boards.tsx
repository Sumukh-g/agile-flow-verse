import CalendarBoard from '@/components/boards/CalendarBoard';
import FlowchartBoard from '@/components/boards/FlowchartBoard';
import GanttBoard from '@/components/boards/GanttBoard';
import KanbanBoard from '@/components/boards/KanbanBoard';
import ListBoard from '@/components/boards/ListBoard';
import MindmapBoard from '@/components/boards/MindmapBoard';
import TimelineBoard from '@/components/boards/TimelineBoard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Brain,
    Calendar,
    Columns,
    Filter,
    GitBranch,
    Grid,
    LayoutDashboard,
    List,
    Lock,
    MoreHorizontal,
    Plus,
    Settings,
    Star,
    StarOff,
    Trello,
    Unlock,
    UserPlus,
    Users
} from 'lucide-react';
import { useState } from 'react';
import { toast } from "sonner";

interface BoardCard {
  id: string;
  title: string;
  description: string;
  collaborators: string[];
  tags: string[];
  createdAt: string;
  starred?: boolean;
  template?: boolean;
  type?: 'kanban' | 'scrum' | 'custom' | 'timeline';
  visibility?: 'private' | 'team' | 'public';
}

const INITIAL_BOARDS: BoardCard[] = [
  {
    id: '1',
    title: 'Product Roadmap',
    description: 'Strategic planning for product development',
    collaborators: ['JD', 'AS'],
    tags: ['Planning', 'Strategy'],
    createdAt: '3 days ago',
    starred: true,
    type: 'kanban',
    visibility: 'team'
  },
  {
    id: '2',
    title: 'Design System',
    description: 'Components and design patterns',
    collaborators: ['RM', 'JW'],
    tags: ['Design', 'UI'],
    createdAt: '1 week ago',
    type: 'kanban',
    visibility: 'team'
  },
  {
    id: '3',
    title: 'Marketing Campaign',
    description: 'Q3 marketing initiatives',
    collaborators: ['TW', 'AS'],
    tags: ['Marketing'],
    createdAt: '2 days ago',
    type: 'timeline',
    visibility: 'public'
  },
  {
    id: '4',
    title: 'Sprint Planning',
    description: 'Current sprint tasks and goals',
    collaborators: ['JD', 'JW', 'TW'],
    tags: ['Development', 'Agile'],
    createdAt: '5 days ago',
    starred: true,
    type: 'scrum',
    visibility: 'team'
  },
  {
    id: '5',
    title: 'Customer Feedback Board',
    description: 'Track and prioritize user requests',
    collaborators: ['JD', 'AS', 'RM'],
    tags: ['Feedback', 'Product'],
    createdAt: '1 week ago',
    type: 'custom',
    visibility: 'team'
  },
  {
    id: '6',
    title: 'Project Timeline',
    description: 'Major milestones and deliverables',
    collaborators: ['JW', 'TW'],
    tags: ['Planning', 'Timeline'],
    createdAt: '2 weeks ago',
    type: 'timeline',
    visibility: 'public'
  },
  {
    id: '7',
    title: 'Kanban Template',
    description: 'Standard workflow template',
    collaborators: [],
    tags: ['Template'],
    createdAt: '1 month ago',
    template: true,
    type: 'kanban',
    visibility: 'private'
  },
];

const BOARD_TYPES = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, description: 'Overview of all boards and projects' },
  { id: 'gantt', name: 'Gantt Chart', icon: Calendar, description: 'Timeline and project management' },
  { id: 'mindmap', name: 'Mindmap', icon: Brain, description: 'Visual thinking and idea mapping' },
  { id: 'flowchart', name: 'Flowchart', icon: GitBranch, description: 'Process flows and diagrams' },
  { id: 'kanban', name: 'Kanban', icon: Trello, description: 'Task management and workflows' }
];

const BoardsPage = () => {
  const [boards, setBoards] = useState<BoardCard[]>(INITIAL_BOARDS);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [newBoardType, setNewBoardType] = useState<string>('kanban');
  const [newBoardVisibility, setNewBoardVisibility] = useState<string>('team');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedBoardType, setSelectedBoardType] = useState('kanban');
  
  const filteredBoards = boards.filter(board => {
    // First filter by search term
    const matchesSearch = board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Then filter by active filter
    let matchesFilter = true;
    if (activeFilter === 'starred') {
      matchesFilter = board.starred === true;
    } else if (activeFilter === 'recent') {
      matchesFilter = board.createdAt.includes('day');
    } else if (activeFilter === 'templates') {
      matchesFilter = board.template === true;
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateBoard = () => {
    if (!newBoardTitle.trim()) {
      toast.error('Please enter a board title');
      return;
    }

    const newBoard: BoardCard = {
      id: Date.now().toString(),
      title: newBoardTitle,
      description: newBoardDesc,
      collaborators: ['JD'],
      tags: [],
      createdAt: 'Just now',
      type: newBoardType as 'kanban' | 'scrum' | 'custom' | 'timeline',
      visibility: newBoardVisibility as 'private' | 'team' | 'public'
    };

    setBoards(prev => [newBoard, ...prev]);
    setNewBoardTitle('');
    setNewBoardDesc('');
    setDialogOpen(false);
    toast.success('Board created successfully');
  };

  const handleDeleteBoard = (id: string) => {
    setBoards(prev => prev.filter(board => board.id !== id));
    toast.success('Board deleted');
  };

  const handleOpenBoard = (id: string) => {
    toast.info(`Opening board: ${boards.find(b => b.id === id)?.title}`);
  };

  const handleStarBoard = (id: string) => {
    setBoards(prev => prev.map(board =>
      board.id === id ? { ...board, starred: !board.starred } : board
    ));
    
    const board = boards.find(b => b.id === id);
    const action = board?.starred ? 'removed from' : 'added to';
    toast.success(`${board?.title} ${action} favorites`);
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'kanban':
        return <Columns className="h-4 w-4 mr-1" />;
      case 'scrum':
        return <Grid className="h-4 w-4 mr-1" />;
      case 'timeline':
        return <List className="h-4 w-4 mr-1" />;
      default:
        return <Columns className="h-4 w-4 mr-1" />;
    }
  };

  const getVisibilityIcon = (visibility?: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="h-4 w-4 mr-1" />;
      case 'public':
        return <Unlock className="h-4 w-4 mr-1" />;
      case 'team':
        return <Users className="h-4 w-4 mr-1" />;
      default:
        return <Users className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
        <p className="text-muted-foreground">
          Visual boards for planning and collaboration.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search boards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="hidden md:block">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setActiveFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter('starred')}>
                Starred
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter('recent')}>
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter('templates')}>
                Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        
          <div className="flex border rounded-md">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => setViewMode('grid')}
              className="rounded-none rounded-l-md"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" />
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-none rounded-r-md"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter board title" 
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter board description"
                    value={newBoardDesc}
                    onChange={(e) => setNewBoardDesc(e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Board Type</Label>
                    <Select 
                      value={newBoardType} 
                      onValueChange={setNewBoardType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select board type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kanban">Kanban Board</SelectItem>
                        <SelectItem value="scrum">Scrum Board</SelectItem>
                        <SelectItem value="timeline">Timeline</SelectItem>
                        <SelectItem value="custom">Custom Board</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select 
                      value={newBoardVisibility} 
                      onValueChange={setNewBoardVisibility}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="template-mode" />
                  <Label htmlFor="template-mode">Create as template</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateBoard}>Create Board</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* NEW: Board/Chart Type Bar */}
      <div className="w-full overflow-x-auto py-2 mb-2">
        <div className="flex gap-2 min-w-[400px]">
          {BOARD_TYPES.map(type => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap font-medium text-base ${selectedBoardType === type.id ? 'bg-indigo-600 text-white shadow' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'}`}
                onClick={() => setSelectedBoardType(type.id)}
                style={{ minWidth: 120 }}
              >
                <IconComponent className="h-4 w-4" />
                <span>{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Board/Chart Content */}
      {selectedBoardType === 'dashboard' && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBoards.map((board) => (
                <Card key={board.id} className={`overflow-hidden ${board.template ? 'border-dashed' : ''}`}>
                  <CardHeader className="p-5">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex-1">{board.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleStarBoard(board.id)}
                        >
                          {board.starred ? 
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
                            <StarOff className="h-4 w-4" />
                          }
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleOpenBoard(board.id)}>Open</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Share</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteBoard(board.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{board.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="flex flex-wrap gap-1 mb-4">
                      {board.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {board.collaborators.map((person, idx) => (
                          <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {person}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {board.collaborators.length > 0 && (
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-2 border-background">
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getTypeIcon(board.type)}
                          {board.type}
                        </Badge>
                        <Badge variant="outline">
                          {getVisibilityIcon(board.visibility)}
                          {board.visibility}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 border-t bg-muted/20">
                    <div className="flex justify-between w-full items-center">
                      <span className="text-xs text-muted-foreground">{board.createdAt}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenBoard(board.id)}
                      >
                        {board.template ? 'Use Template' : 'Open Board'}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="py-4 px-6">
                <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Visibility</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-1"></div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredBoards.map((board) => (
                  <div 
                    key={board.id}
                    className="grid grid-cols-12 items-center px-6 py-3 hover:bg-muted/50 border-b last:border-0"
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleStarBoard(board.id)}
                      >
                        {board.starred ? 
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
                          <StarOff className="h-4 w-4" />
                        }
                      </Button>
                      <div>
                        <p className="font-medium">{board.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{board.description}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline">
                        {getTypeIcon(board.type)}
                        {board.type}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline">
                        {getVisibilityIcon(board.visibility)}
                        {board.visibility}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-xs text-muted-foreground">
                      {board.createdAt}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenBoard(board.id)}>Open</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteBoard(board.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {filteredBoards.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No boards found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try a different search term' : 'Create your first board to get started'}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Board
              </Button>
            </div>
          )}
        </>
      )}
      {selectedBoardType === 'gantt' && (
        <GanttBoard />
      )}
      {selectedBoardType === 'kanban' && (
        <KanbanBoard />
      )}
      {selectedBoardType === 'flowchart' && (
        <FlowchartBoard />
      )}
      {selectedBoardType === 'list' && (
        <ListBoard />
      )}
      {selectedBoardType === 'timeline' && (
        <TimelineBoard />
      )}
      {selectedBoardType === 'calendar' && (
        <CalendarBoard />
      )}
      {selectedBoardType === 'mindmap' && (
        <MindmapBoard />
      )}
      {selectedBoardType === 'swimlane' && (
        <div className="p-8 text-center text-lg text-muted-foreground">Swimlane board coming soon!</div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" onClick={(e) => e.preventDefault()}>
            <Settings className="mr-2 h-4 w-4" />
            Board Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Board Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Default Board Type</Label>
              <Select defaultValue="kanban">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kanban">Kanban Board</SelectItem>
                  <SelectItem value="scrum">Scrum Board</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default View</Label>
              <Select defaultValue="grid">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoAssign">Auto-assign to creator</Label>
                <Switch id="autoAssign" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableTemplates">Enable templates</Label>
                <Switch id="enableTemplates" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableWipLimits">WIP limits</Label>
                <Switch id="enableWipLimits" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => toast.success('Settings saved')}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoardsPage;
