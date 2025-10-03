
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import React from 'react';
import CreateTaskDialog from './CreateTaskDialog';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  projectName?: string;
}

interface TaskTimelineViewProps {
  tasks: Task[];
  onTaskCreate: (task: Task) => void;
}

const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({ tasks, onTaskCreate }) => {
  // Sample timeline setup with current month days
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() + i - 7); // Show a week before and after
    return date;
  });
  
  // Group tasks by assignee for the timeline view
  const tasksByAssignee: Record<string, Task[]> = {};
  
  tasks.forEach(task => {
    if (!tasksByAssignee[task.assignee]) {
      tasksByAssignee[task.assignee] = [];
    }
    tasksByAssignee[task.assignee].push(task);
  });

  const assignees = Object.keys(tasksByAssignee);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button variant="outline">
            Today
          </Button>
          
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="mx-2 font-medium">Timeline View</div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <CreateTaskDialog onTaskCreate={onTaskCreate} />
        </div>
      </div>
      
      <div className="border rounded-md">
        {/* Timeline header */}
        <div className="grid grid-cols-[200px_1fr] border-b">
          <div className="p-2 font-medium border-r">Assignee</div>
          <div className="grid grid-cols-14 border-b">
            {days.map((day, i) => {
              const isToday = day.getDate() === today.getDate() && 
                              day.getMonth() === today.getMonth() && 
                              day.getFullYear() === today.getFullYear();
              
              return (
                <div 
                  key={i} 
                  className={`p-2 text-center text-sm ${isToday ? 'bg-primary/10' : ''} ${i < 13 ? 'border-r' : ''}`}
                >
                  <div className="text-xs text-muted-foreground">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Timeline rows */}
        {assignees.map((assignee, idx) => (
          <div key={assignee} className="grid grid-cols-[200px_1fr] border-b last:border-b-0">
            <div className="p-3 border-r flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{assignee}</span>
            </div>
            <div className="relative h-16">
              {tasksByAssignee[assignee].map(task => {
                // Calculate position based on task creation date
                const taskDate = new Date(task.createdAt);
                const startDate = days[0];
                const endDate = days[days.length - 1];
                
                // Calculate position within the timeline
                const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const taskDaysFromStart = Math.ceil((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                // Ensure task is within visible range
                const startPos = Math.max(0, Math.min(taskDaysFromStart, totalDays - 1));
                const width = Math.max(1, Math.min(3, Math.floor(Math.random() * 3) + 1)); // Random width for visual variety
                
                return (
                  <div 
                    key={task.id}
                    className={`absolute top-2 h-12 overflow-hidden rounded border cursor-pointer hover:shadow-md transition-shadow ${
                      task.priority === 'HIGH' ? 'bg-red-100 border-red-200' :
                      task.priority === 'MEDIUM' ? 'bg-amber-100 border-amber-200' :
                      'bg-green-100 border-green-200'
                    }`}
                    style={{
                      left: `${(startPos / totalDays) * 100}%`,
                      width: `${(width / totalDays) * 100}%`
                    }}
                    title={`${task.title} - ${task.status} - Created: ${new Date(task.createdAt).toLocaleDateString()}`}
                  >
                    <div className="p-1 text-xs font-medium truncate">{task.title}</div>
                    <div className="px-1 text-xs text-muted-foreground truncate">
                      {task.status} • {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskTimelineView;
