
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, 
  Calendar as CalendarIcon, LineChart, Filter, ArrowDownUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useGantt } from '@/hooks/useGantt';

interface Task {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies?: string[];
  owner: string;
}

interface ProjectTimelineViewProps {
  projectId?: string;
}

const ProjectTimelineView = ({ projectId }: ProjectTimelineViewProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineDate, setTimelineDate] = useState<Date>(new Date());
  const [timeScale, setTimeScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  
  const { data: ganttData, isLoading: ganttLoading } = useGantt(projectId);

  useEffect(() => {
    if (!ganttData) return;
    const mapped: Task[] = (ganttData.tasks || []).map((t: any) => ({
      id: t.id,
      title: t.name,
      status: t.progress === 100 ? 'Done' : t.progress > 0 ? 'In Progress' : 'To Do',
      startDate: new Date(t.start).toISOString().slice(0, 10),
      endDate: new Date(t.end).toISOString().slice(0, 10),
      progress: t.progress,
      dependencies: t.dependencies,
      owner: (t.assignees || [])[0] || '',
    }));
    setTasks(mapped);
    setLoading(false);
  }, [ganttData]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return 'bg-slate-200';
      case 'In Progress':
        return 'bg-blue-200';
      case 'Done':
        return 'bg-green-200';
      default:
        return 'bg-slate-200';
    }
  };
  
  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      const current = new Date(dateString);
      return current >= start && current <= end;
    });
  };
  
  // Timeline Zoom functions
  const zoomIn = () => {
    if (timeScale === 'months') setTimeScale('weeks');
    else if (timeScale === 'weeks') setTimeScale('days');
    toast.info(`Zoomed in to ${timeScale} view`);
  };
  
  const zoomOut = () => {
    if (timeScale === 'days') setTimeScale('weeks');
    else if (timeScale === 'weeks') setTimeScale('months');
    toast.info(`Zoomed out to ${timeScale} view`);
  };
  
  // Navigation functions
  const goToPreviousPeriod = () => {
    const newDate = new Date(timelineDate);
    if (timeScale === 'days') newDate.setDate(newDate.getDate() - 7);
    else if (timeScale === 'weeks') newDate.setDate(newDate.getDate() - 14);
    else if (timeScale === 'months') newDate.setMonth(newDate.getMonth() - 1);
    setTimelineDate(newDate);
  };
  
  const goToNextPeriod = () => {
    const newDate = new Date(timelineDate);
    if (timeScale === 'days') newDate.setDate(newDate.getDate() + 7);
    else if (timeScale === 'weeks') newDate.setDate(newDate.getDate() + 14);
    else if (timeScale === 'months') newDate.setMonth(newDate.getMonth() + 1);
    setTimelineDate(newDate);
  };
  
  const goToToday = () => {
    setTimelineDate(new Date());
  };
  
  // Calculate the date range for the current view
  const getDaysInView = () => {
    const days = [];
    const startDate = new Date(timelineDate);
    
    // Adjust start date to beginning of week/month
    if (timeScale === 'weeks' || timeScale === 'months') {
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Move to beginning of week
    }
    if (timeScale === 'months') {
      startDate.setDate(1); // Move to beginning of month
    }
    
    // Determine number of days to show
    const daysToShow = timeScale === 'days' ? 7 : 
                       timeScale === 'weeks' ? 14 : 
                       30; // approximation for a month
    
    for (let i = 0; i < daysToShow; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };
  
  // Simplified function to generate timeline view
  const renderTimeline = () => {
    const days = getDaysInView();
    const daysHorizontalScale = timeScale === 'days' ? 100 : 
                              timeScale === 'weeks' ? 50 : 
                              30; // width in px
    
    return (
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Timeline header with dates */}
          <div className="flex border-b">
            <div className="w-48 flex-shrink-0 px-4 py-2 font-medium">Task</div>
            <div className="flex">
              {days.map((day, idx) => (
                <div 
                  key={idx}
                  className={`flex-shrink-0 text-center border-r text-xs px-2 py-1`}
                  style={{ width: `${daysHorizontalScale}px` }}
                >
                  <div className="font-medium">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                  <div>{day.getDate()}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Task rows */}
          <div>
            {tasks.map(task => {
              const startDate = new Date(task.startDate);
              const endDate = new Date(task.endDate);
              const firstDay = days[0];
              const lastDay = days[days.length - 1];
              
              // Skip if task is completely outside the visible range
              if (endDate < firstDay || startDate > lastDay) {
                return null;
              }
              
              // Calculate position and width of task bar
              const startOffset = Math.max(0, (startDate.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
              const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
              const visibleDuration = Math.min(duration, days.length - startOffset);
              
              return (
                <div key={task.id} className="flex border-b hover:bg-slate-50">
                  <div className="w-48 flex-shrink-0 px-4 py-3 font-medium truncate">
                    {task.title}
                  </div>
                  <div className="flex relative" style={{ minHeight: '40px' }}>
                    {days.map((day, idx) => (
                      <div 
                        key={idx} 
                        className="flex-shrink-0 border-r"
                        style={{ width: `${daysHorizontalScale}px` }}
                      />
                    ))}
                    
                    {/* Task bar */}
                    <div 
                      className={`absolute top-2 h-8 rounded flex items-center px-2 ${getStatusColor(task.status)}`}
                      style={{ 
                        left: `${startOffset * daysHorizontalScale}px`,
                        width: `${visibleDuration * daysHorizontalScale - 4}px`,
                      }}
                      onClick={() => toast.info(`Task: ${task.title}`)}
                    >
                      <div className="text-xs font-medium truncate">
                        {timeScale === 'days' || task.title.length < 15 ? task.title : ''}
                        {task.progress > 0 && task.progress < 100 && (
                          <span className="ml-1">({task.progress}%)</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Dependency lines would go here in a full implementation */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // Render calendar view
  const renderCalendar = () => {
    const selectedDay = timelineDate;
    const tasksOnSelectedDay = getTasksForDate(selectedDay);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-1">
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={(date) => date && setTimelineDate(date)}
            className="rounded-md border"
          />
        </div>
        
        <div className="md:col-span-2">
          <h3 className="font-medium mb-4">
            Tasks for {selectedDay.toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {tasksOnSelectedDay.length > 0 ? (
            <div className="space-y-3">
              {tasksOnSelectedDay.map(task => (
                <Card key={task.id} className="overflow-hidden">
                  <div className={`h-1 ${getStatusColor(task.status)}`} />
                  <CardContent className="p-4">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {task.startDate} to {task.endDate} • Owner: {task.owner}
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="bg-slate-200 h-1.5 flex-grow rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium ml-2">{task.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-md p-6 text-center text-muted-foreground">
              <p>No tasks scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <p>Loading timeline...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Filtering tasks")}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => toast.info("Sorting tasks")}>
            <ArrowDownUp className="h-4 w-4 mr-2" />
            Sort
          </Button>
          
          <Select value={view} onValueChange={(value) => setView(value as 'timeline' | 'calendar')}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeline">Timeline</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {timelineDate.toLocaleDateString(undefined, { 
                month: 'short', 
                year: 'numeric',
                ...(timeScale === 'days' || timeScale === 'weeks' ? { day: 'numeric' } : {})
              })}
            </span>
          </div>
          
          {view === 'timeline' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="w-8 h-8" onClick={zoomOut}
                      disabled={timeScale === 'months'}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Select value={timeScale} onValueChange={(value) => setTimeScale(value as any)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Time Scale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="w-8 h-8" onClick={zoomIn}
                      disabled={timeScale === 'days'}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Timeline/Calendar View Toggle */}
        <div className="rounded-md border overflow-x-auto overflow-y-hidden">
          {view === 'timeline' ? renderTimeline() : renderCalendar()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTimelineView;
