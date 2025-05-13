
import React, { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CreateTaskDialog from './CreateTaskDialog';

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  status: string;
}

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskCreate: (task: Task) => void;
}

const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks, onTaskCreate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const daysInWeek = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: endOfCurrentWeek,
  });
  
  const navigateToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };
  
  const navigateToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDay = (day: Date) => {
    const formattedDay = format(day, 'MMM dd');
    return tasks.filter(task => {
      if (!task.dueDate || task.dueDate === 'Not set') return false;
      return task.dueDate === formattedDay || task.dueDate.includes(formattedDay);
    });
  };
  
  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigateToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          
          <Button variant="outline" size="icon" onClick={navigateToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-medium ml-2">
            {format(startOfCurrentWeek, 'MMM d')} - {format(endOfCurrentWeek, 'MMM d, yyyy')}
          </h3>
        </div>
        
        <CreateTaskDialog onTaskCreate={onTaskCreate} />
      </div>
      
      <div className="grid grid-cols-7 gap-4">
        {daysInWeek.map((day, index) => (
          <div key={index} className="space-y-1">
            <div className={`text-center p-2 font-medium ${isToday(day) ? 'bg-primary text-primary-foreground rounded-md' : ''}`}>
              <div className="text-xs uppercase">{format(day, 'EEE')}</div>
              <div className="text-lg">{format(day, 'd')}</div>
            </div>
            
            <div className="space-y-2 p-1 min-h-[calc(100vh-300px)] max-h-[calc(100vh-300px)] overflow-y-auto">
              {getTasksForDay(day).map(task => (
                <Card key={task.id} className="border shadow-sm">
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm line-clamp-2">{task.title}</div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className={
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {task.priority}
                        </Badge>
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {task.assignee}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="ghost" size="sm" className="w-full flex items-center justify-center text-xs text-muted-foreground">
                <Plus className="h-3 w-3 mr-1" />
                Add task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskCalendarView;
