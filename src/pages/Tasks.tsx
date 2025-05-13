
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, SlidersHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Task data
const TASKS = {
  'To Do': [
    {
      id: 't1',
      title: 'Research competitor features',
      priority: 'Medium',
      dueDate: 'May 20',
      assignee: 'JD',
      tags: ['Research', 'Product']
    },
    {
      id: 't2',
      title: 'Review design mockups',
      priority: 'High',
      dueDate: 'May 18',
      assignee: 'AS',
      tags: ['Design', 'Review']
    },
    {
      id: 't3',
      title: 'Setup analytics tracking',
      priority: 'Low',
      dueDate: 'May 25',
      assignee: 'RM',
      tags: ['Marketing', 'Analytics']
    }
  ],
  'In Progress': [
    {
      id: 't4',
      title: 'Create user onboarding flow',
      priority: 'High',
      dueDate: 'May 19',
      assignee: 'JW',
      tags: ['UX', 'Design']
    },
    {
      id: 't5',
      title: 'Implement authentication system',
      priority: 'High',
      dueDate: 'May 18',
      assignee: 'TW',
      tags: ['Backend', 'Security']
    }
  ],
  'In Review': [
    {
      id: 't6',
      title: 'Optimize homepage load time',
      priority: 'Medium',
      dueDate: 'May 15',
      assignee: 'JD',
      tags: ['Performance', 'Frontend']
    },
    {
      id: 't7',
      title: 'Add payment processing feature',
      priority: 'Medium',
      dueDate: 'May 16',
      assignee: 'RM',
      tags: ['Backend', 'Payment']
    }
  ],
  'Done': [
    {
      id: 't8',
      title: 'Create marketing landing page',
      priority: 'High',
      dueDate: 'May 12',
      assignee: 'AS',
      tags: ['Marketing', 'Frontend']
    },
    {
      id: 't9',
      title: 'Conduct user interviews',
      priority: 'Medium',
      dueDate: 'May 10',
      assignee: 'JW',
      tags: ['Research', 'UX']
    },
    {
      id: 't10',
      title: 'Fix login page bugs',
      priority: 'High',
      dueDate: 'May 11',
      assignee: 'TW',
      tags: ['Bug', 'Frontend']
    }
  ]
};

const Tasks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter tasks based on search query
  const filteredTasks = Object.entries(TASKS).reduce((acc, [status, tasks]) => {
    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[status] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof TASKS[keyof typeof TASKS]>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Track and manage tasks across projects.
        </p>
      </div>
      
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Group
          </Button>
          
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="task-board">
        {Object.entries(filteredTasks).map(([status, tasks]) => (
          <TaskColumn
            key={status}
            title={status}
            tasks={tasks}
            getPriorityColor={getPriorityColor}
          />
        ))}
      </div>
    </div>
  );
};

interface TaskColumnProps {
  title: string;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string;
    assignee: string;
    tags: string[];
  }>;
  getPriorityColor: (priority: string) => string;
}

const TaskColumn = ({ title, tasks, getPriorityColor }: TaskColumnProps) => {
  // Get column header color
  const getColumnColor = () => {
    switch (title) {
      case 'To Do':
        return 'bg-slate-200';
      case 'In Progress':
        return 'bg-blue-200';
      case 'In Review':
        return 'bg-purple-200';
      case 'Done':
        return 'bg-green-200';
      default:
        return 'bg-slate-200';
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
      <div className={`px-3 py-2 rounded-t-md ${getColumnColor()}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="bg-white text-xs font-medium rounded-full px-2 py-0.5 text-slate-600">
            {tasks.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 rounded-b-md">
        <div className="flex flex-col gap-2">
          {tasks.map(task => (
            <Card key={task.id} className="border shadow-sm">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="font-medium text-sm">{task.title}</div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <span className="text-muted-foreground">{task.dueDate}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {task.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{task.tags.length - 2}</span>
                      )}
                    </div>
                    
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {task.assignee}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground justify-start"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add task
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
