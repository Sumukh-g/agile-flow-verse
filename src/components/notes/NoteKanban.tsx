import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    Archive,
    Calendar,
    CheckCircle,
    Circle,
    Clock,
    MoreHorizontal,
    Plus,
    Tag,
    User
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  cards: KanbanCard[];
}

const NoteKanban: React.FC<{ note: any; onUpdateNote: (noteId: string, updates: any) => void }> = ({ note, onUpdateNote }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'todo',
      title: 'To Do',
      status: 'todo',
      cards: [
        {
          id: '1',
          title: 'Research competitor analysis',
          description: 'Analyze top 5 competitors in the market',
          status: 'todo',
          priority: 'high',
          assignee: 'John Doe',
          dueDate: '2024-01-20',
          tags: ['research', 'analysis'],
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15'
        },
        {
          id: '2',
          title: 'Create user personas',
          description: 'Define target user groups and their needs',
          status: 'todo',
          priority: 'medium',
          assignee: 'Jane Smith',
          dueDate: '2024-01-22',
          tags: ['ux', 'research'],
          createdAt: '2024-01-16',
          updatedAt: '2024-01-16'
        }
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      status: 'in-progress',
      cards: [
        {
          id: '3',
          title: 'Design wireframes',
          description: 'Create low-fidelity wireframes for main pages',
          status: 'in-progress',
          priority: 'high',
          assignee: 'Mike Johnson',
          dueDate: '2024-01-25',
          tags: ['design', 'wireframes'],
          createdAt: '2024-01-14',
          updatedAt: '2024-01-17'
        }
      ]
    },
    {
      id: 'review',
      title: 'Review',
      status: 'review',
      cards: [
        {
          id: '4',
          title: 'User testing plan',
          description: 'Plan and schedule user testing sessions',
          status: 'review',
          priority: 'medium',
          assignee: 'Sarah Wilson',
          dueDate: '2024-01-28',
          tags: ['testing', 'planning'],
          createdAt: '2024-01-12',
          updatedAt: '2024-01-18'
        }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      status: 'done',
      cards: [
        {
          id: '5',
          title: 'Project kickoff meeting',
          description: 'Conduct initial project planning meeting',
          status: 'done',
          priority: 'high',
          assignee: 'Alex Brown',
          dueDate: '2024-01-10',
          tags: ['meeting', 'planning'],
          createdAt: '2024-01-08',
          updatedAt: '2024-01-10'
        }
      ]
    }
  ]);

  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignee: '',
    dueDate: '',
    tags: ''
  });
  const [selectedColumn, setSelectedColumn] = useState('todo');

  const handleCreateCard = () => {
    if (newCard.title.trim()) {
      const card: KanbanCard = {
        id: Date.now().toString(),
        title: newCard.title,
        description: newCard.description,
        status: selectedColumn as any,
        priority: newCard.priority,
        assignee: newCard.assignee,
        dueDate: newCard.dueDate,
        tags: newCard.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      setColumns(prev => 
        prev.map(column => 
          column.id === selectedColumn 
            ? { ...column, cards: [...column.cards, card] }
            : column
        )
      );

      setNewCard({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '', tags: '' });
      setShowCreateCard(false);
      toast.success('Card created successfully');
    }
  };

  const handleMoveCard = (cardId: string, fromColumn: string, toColumn: string) => {
    setColumns(prev => {
      const newColumns = [...prev];
      const fromCol = newColumns.find(col => col.id === fromColumn);
      const toCol = newColumns.find(col => col.id === toColumn);
      
      if (fromCol && toCol) {
        const card = fromCol.cards.find(c => c.id === cardId);
        if (card) {
          // Remove from source column
          fromCol.cards = fromCol.cards.filter(c => c.id !== cardId);
          // Add to destination column with updated status
          toCol.cards.push({ ...card, status: toColumn as any, updatedAt: new Date().toISOString().split('T')[0] });
        }
      }
      return newColumns;
    });
    toast.success('Card moved successfully');
  };

  const handleDeleteCard = (cardId: string, columnId: string) => {
    setColumns(prev => 
      prev.map(column => 
        column.id === columnId 
          ? { ...column, cards: column.cards.filter(card => card.id !== cardId) }
          : column
      )
    );
    toast.success('Card deleted');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Circle className="h-4 w-4 text-gray-400" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'review': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'done': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kanban Board</h3>
          <p className="text-sm text-muted-foreground">
            Organize your tasks and track progress visually
          </p>
        </div>
        <Button onClick={() => setShowCreateCard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(column.status)}
                <h4 className="font-medium">{column.title}</h4>
                <Badge variant="secondary">{column.cards.length}</Badge>
              </div>
            </div>
            
            <div className="space-y-3 min-h-[400px]">
              {column.cards.map((card) => (
                <Card key={card.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{card.title}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Badge className={getPriorityColor(card.priority)}>
                          {card.priority}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {card.description && (
                      <CardDescription className="text-xs">
                        {card.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {card.assignee && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{card.assignee}</span>
                        </div>
                      )}
                      {card.dueDate && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{card.dueDate}</span>
                        </div>
                      )}
                      {card.tags.length > 0 && (
                        <div className="flex items-center space-x-1 text-xs">
                          <Tag className="h-3 w-3" />
                          <div className="flex flex-wrap gap-1">
                            {card.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        Updated {card.updatedAt}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCard(card.id, column.id)}
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Drop zone for moving cards */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-muted-foreground hover:border-gray-400 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData('cardId');
                  if (cardId) {
                    handleMoveCard(cardId, 'from-column', column.id);
                  }
                }}
              >
                Drop cards here
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Card Form */}
      {showCreateCard && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Create New Card</CardTitle>
            <CardDescription>
              Add a new task to your kanban board
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="card-title">Title</Label>
                <Input
                  id="card-title"
                  placeholder="Enter card title"
                  value={newCard.title}
                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-column">Column</Label>
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-description">Description</Label>
              <Textarea
                id="card-description"
                placeholder="Enter card description"
                value={newCard.description}
                onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="card-priority">Priority</Label>
                <Select value={newCard.priority} onValueChange={(value: any) => setNewCard({ ...newCard, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-assignee">Assignee</Label>
                <Input
                  id="card-assignee"
                  placeholder="Enter assignee name"
                  value={newCard.assignee}
                  onChange={(e) => setNewCard({ ...newCard, assignee: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-due-date">Due Date</Label>
                <Input
                  id="card-due-date"
                  type="date"
                  value={newCard.dueDate}
                  onChange={(e) => setNewCard({ ...newCard, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-tags">Tags (comma-separated)</Label>
              <Input
                id="card-tags"
                placeholder="e.g. design, frontend, bug"
                value={newCard.tags}
                onChange={(e) => setNewCard({ ...newCard, tags: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateCard} disabled={!newCard.title.trim()}>
                Create Card
              </Button>
              <Button variant="outline" onClick={() => setShowCreateCard(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoteKanban; 