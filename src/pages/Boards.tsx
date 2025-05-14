
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BoardCard {
  id: string;
  title: string;
  description: string;
  collaborators: string[];
  tags: string[];
  createdAt: string;
}

const INITIAL_BOARDS: BoardCard[] = [
  {
    id: '1',
    title: 'Product Roadmap',
    description: 'Strategic planning for product development',
    collaborators: ['JD', 'AS'],
    tags: ['Planning', 'Strategy'],
    createdAt: '3 days ago'
  },
  {
    id: '2',
    title: 'Design System',
    description: 'Components and design patterns',
    collaborators: ['RM', 'JW'],
    tags: ['Design', 'UI'],
    createdAt: '1 week ago'
  },
  {
    id: '3',
    title: 'Marketing Campaign',
    description: 'Q3 marketing initiatives',
    collaborators: ['TW', 'AS'],
    tags: ['Marketing'],
    createdAt: '2 days ago'
  },
  {
    id: '4',
    title: 'Sprint Planning',
    description: 'Current sprint tasks and goals',
    collaborators: ['JD', 'JW', 'TW'],
    tags: ['Development', 'Agile'],
    createdAt: '5 days ago'
  }
];

const BoardsPage = () => {
  const [boards, setBoards] = useState<BoardCard[]>(INITIAL_BOARDS);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBoards = boards.filter(board => 
    board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      createdAt: 'Just now'
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateBoard}>Create Board</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoards.map((board) => (
          <Card key={board.id} className="overflow-hidden">
            <CardHeader className="p-5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{board.title}</CardTitle>
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
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-sm text-muted-foreground mb-4">{board.description}</p>
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
                </div>
                <span className="text-xs text-muted-foreground">{board.createdAt}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => handleOpenBoard(board.id)}
              >
                Open Board
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
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
    </div>
  );
};

export default BoardsPage;
