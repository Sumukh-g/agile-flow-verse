import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarEvent as ApiCalendarEvent,
    CreateCalendarEventData,
    useCreateCalendarEvent,
    useDeleteCalendarEvent,
    useProjectCalendarEvents,
    useToggleCalendarEventComplete,
    useUpdateCalendarEvent,
    useAICalendarSuggestions,
    useOptimizeSchedule,
    useGenerateRecurringEvents,
    AISuggestion,
    RecurringEventTemplate
} from '@/hooks/useCalendar';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { 
    addDays, 
    eachDayOfInterval, 
    endOfWeek, 
    format, 
    formatISO, 
    isSameDay, 
    isToday, 
    parseISO, 
    startOfWeek,
    startOfMonth,
    endOfMonth,
    eachHourOfInterval,
    setHours,
    setMinutes,
    differenceInMinutes,
    addMinutes,
    subMinutes
} from 'date-fns';
import {
    Calendar as CalendarIcon,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    MapPin,
    Plus,
    Trash2,
    Users,
    Video,
    Zap,
    Brain,
    Settings,
    Filter,
    Search,
    RefreshCw,
    Download,
    Share2,
    MoreHorizontal,
    AlertTriangle,
    Lightbulb,
    Repeat,
    Target,
    TrendingUp
} from 'lucide-react';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { toast } from "sonner";

type CalendarEvent = ApiCalendarEvent;

interface ProjectCalendarProps {
  projectId: string;
  projectName: string;
}

type ViewType = 'month' | 'week' | 'day' | 'agenda' | 'year';

const ProjectCalendar: React.FC<ProjectCalendarProps> = ({ projectId, projectName }) => {
  // State management
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [optimizationOpen, setOptimizationOpen] = useState(false);
  const [recurringEventOpen, setRecurringEventOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Get projects for filtering
  const { data: projects = [] } = useProjects();

  // API hooks
  const { data: events = [], isLoading } = useProjectCalendarEvents(projectId);
  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();
  const toggleCompleteMutation = useToggleCalendarEventComplete();
  
  // AI hooks
  const { data: aiSuggestions } = useAICalendarSuggestions();
  const optimizeScheduleMutation = useOptimizeSchedule();
  const generateRecurringEventsMutation = useGenerateRecurringEvents();

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'meeting' as const,
    priority: 'medium' as const,
    startTime: '',
    endTime: '',
    location: '',
    attendees: '',
    isOnline: false,
    isRecurring: false,
    recurrence: 'weekly' as const,
    reminder: 15,
    color: '#3b82f6'
  });

  // Recurring event template
  const [recurringTemplate, setRecurringTemplate] = useState<RecurringEventTemplate>({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    type: 'meeting',
    priority: 'medium',
    frequency: 'weekly'
  });

  // Memoized computations
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filterType !== 'all' && event.type !== filterType) return false;
      if (filterPriority !== 'all' && event.priority !== filterPriority) return false;
      if (!showCompleted && event.completed) return false;
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [events, filterType, filterPriority, showCompleted, searchTerm]);

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(event => 
      isSameDay(parseISO(event.date), selectedDate)
    );
  }, [filteredEvents, selectedDate]);

  const highlightedDates = useMemo(() => {
    const dateMap: Record<string, { backgroundColor: string, textColor: string }> = {};
    
    filteredEvents.forEach(event => {
      const eventDate = format(parseISO(event.date), 'yyyy-MM-dd');
      if (event.priority === 'urgent' || event.priority === 'high') {
        dateMap[eventDate] = { backgroundColor: '#fee2e2', textColor: '#991b1b' };
      } else if (!dateMap[eventDate]) {
        dateMap[eventDate] = { backgroundColor: '#dbeafe', textColor: '#1e40af' };
      }
    });
    
    return dateMap;
  }, [filteredEvents]);

  // Event handlers
  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    if (viewType === 'day' && date) {
      setSelectedDate(date);
    }
  }, [viewType]);

  const handleCreateEvent = useCallback(async () => {
    if (!newEvent.title || !selectedDate) return;

    const eventData: CreateCalendarEventData = {
      ...newEvent,
      date: formatISO(selectedDate),
      attendees: newEvent.attendees ? newEvent.attendees.split(',').map(a => a.trim()) : [],
      projectId: projectId
    };

    await createEventMutation.mutateAsync(eventData);
    setDialogOpen(false);
    setNewEvent({
      title: '',
      description: '',
      type: 'meeting',
      priority: 'medium',
      startTime: '',
      endTime: '',
      location: '',
      attendees: '',
      isOnline: false,
      isRecurring: false,
      recurrence: 'weekly',
      reminder: 15,
      color: '#3b82f6'
    });
  }, [newEvent, selectedDate, projectId, createEventMutation]);

  const handleUpdateEvent = useCallback(async () => {
    if (!editingEvent) return;

    await updateEventMutation.mutateAsync({
      id: editingEvent.id,
      data: {
        title: editingEvent.title,
        description: editingEvent.description,
        date: editingEvent.date,
        startTime: editingEvent.startTime,
        endTime: editingEvent.endTime,
        type: editingEvent.type,
        priority: editingEvent.priority,
        location: editingEvent.location,
        attendees: editingEvent.attendees,
        isOnline: editingEvent.isOnline,
        isRecurring: editingEvent.isRecurring,
        recurrence: editingEvent.recurrence,
        reminder: editingEvent.reminder,
        color: editingEvent.color,
        completed: editingEvent.completed,
        notes: editingEvent.notes,
        projectId: editingEvent.projectId
      }
    });
    setDialogOpen(false);
    setEditingEvent(null);
  }, [editingEvent, updateEventMutation]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    await deleteEventMutation.mutateAsync(eventId);
    setEventDetailsOpen(false);
    setSelectedEvent(null);
  }, [deleteEventMutation]);

  const handleToggleComplete = useCallback(async (eventId: string) => {
    await toggleCompleteMutation.mutateAsync(eventId);
  }, [toggleCompleteMutation]);

  const handleOptimizeSchedule = useCallback(async () => {
    const startDate = format(startOfMonth(selectedDate || new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(selectedDate || new Date()), 'yyyy-MM-dd');
    
    await optimizeScheduleMutation.mutateAsync({ start: startDate, end: endDate });
    setOptimizationOpen(false);
  }, [selectedDate, optimizeScheduleMutation]);

  const handleGenerateRecurringEvents = useCallback(async () => {
    await generateRecurringEventsMutation.mutateAsync(recurringTemplate);
    setRecurringEventOpen(false);
  }, [recurringTemplate, generateRecurringEventsMutation]);

  // Render different calendar views
  const renderMonthView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {eachDayOfInterval({
          start: startOfMonth(selectedDate || new Date()),
          end: endOfMonth(selectedDate || new Date())
        }).map(day => {
          const dayEvents = filteredEvents.filter(event => 
            isSameDay(parseISO(event.date), day)
          );
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 border border-border hover:bg-accent/50 cursor-pointer",
                isToday(day) && "bg-primary/10 border-primary",
                isSameDay(day, selectedDate || new Date()) && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setEventDetailsOpen(true);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate || new Date());
    const weekEnd = endOfWeek(selectedDate || new Date());
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = eachHourOfInterval({
      start: setHours(weekStart, 0),
      end: setHours(weekStart, 23)
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2"></div>
          {days.map(day => (
            <div key={day.toISOString()} className="p-2 text-center text-sm font-medium">
              <div>{format(day, 'EEE')}</div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour.toISOString()} className="h-12 text-xs text-muted-foreground p-1">
                {format(hour, 'HH:mm')}
              </div>
            ))}
          </div>
          {days.map(day => (
            <div key={day.toISOString()} className="space-y-1 relative">
              {hours.map(hour => (
                <div key={hour.toISOString()} className="h-12 border border-border/50"></div>
              ))}
              {filteredEvents
                .filter(event => isSameDay(parseISO(event.date), day))
                .map(event => {
                  const startTime = event.startTime ? parseISO(`2000-01-01T${event.startTime}`) : null;
                  const endTime = event.endTime ? parseISO(`2000-01-01T${event.endTime}`) : null;
                  if (!startTime || !endTime) return null;

                  const startHour = startTime.getHours();
                  const startMinute = startTime.getMinutes();
                  const duration = differenceInMinutes(endTime, startTime);
                  const top = startHour * 48 + startMinute * 0.8; // 48px per hour, 0.8px per minute
                  const height = Math.max(duration * 0.8, 20); // Minimum 20px height

                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded p-1 text-xs bg-primary/10 border border-primary/20 cursor-pointer z-10"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventDetailsOpen(true);
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-muted-foreground truncate">
                        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (!selectedDate) return null;

    const hours = eachHourOfInterval({
      start: setHours(selectedDate, 0),
      end: setHours(selectedDate, 23)
    });

    const dayEvents = filteredEvents.filter(event => 
      isSameDay(parseISO(event.date), selectedDate)
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-1 max-h-[600px] overflow-y-auto">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              if (!event.startTime) return false;
              const eventHour = parseInt(event.startTime.split(':')[0]);
              return eventHour === hour.getHours();
            });

            return (
              <div key={hour.toISOString()} className="grid grid-cols-12 gap-1 min-h-[60px]">
                <div className="col-span-1 text-sm text-muted-foreground p-2">
                  {format(hour, 'HH:mm')}
                </div>
                <div className="col-span-11 border-l border-border/50 p-2 relative">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="mb-2 p-2 rounded bg-primary/10 border border-primary/20 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventDetailsOpen(true);
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.startTime} - {event.endTime}
                      </div>
                      {event.location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => (
    <div className="space-y-4">
      {filteredEvents
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(event => (
          <div
            key={event.id}
            className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer"
            onClick={() => {
              setSelectedEvent(event);
              setEventDetailsOpen(true);
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-muted-foreground">
                  {format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}
                  {event.startTime && ` at ${event.startTime}`}
                </div>
                {event.description && (
                  <div className="text-sm mt-1">{event.description}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={event.priority === 'urgent' ? 'destructive' : 'secondary'}>
                  {event.priority}
                </Badge>
                <Badge variant="outline">{event.type}</Badge>
                {event.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
            </div>
          </div>
        ))}
    </div>
  );

  const renderCurrentView = () => {
    switch (viewType) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Calendar - {projectName}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(subMinutes(selectedDate || new Date(), 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addMinutes(selectedDate || new Date(), 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiSuggestionsOpen(true)}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Suggestions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOptimizationOpen(true)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Optimize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecurringEventOpen(true)}
          >
            <Repeat className="h-4 w-4 mr-2" />
            Recurring
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="appointment">Appointment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
          />
          <Label>Show Completed</Label>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mini Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border-0"
                modifiers={{
                  highlighted: Object.keys(highlightedDates).map(date => new Date(date))
                }}
                modifiersStyles={highlightedDates}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar View */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {viewType === 'day' && selectedDate 
                  ? format(selectedDate, 'MMMM d, yyyy') 
                  : viewType === 'week' && selectedDate
                  ? `${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d')}`
                  : viewType === 'month' && selectedDate
                  ? format(selectedDate, 'MMMM yyyy')
                  : 'Events'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderCurrentView()
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingEvent?.title || newEvent.title}
                  onChange={(e) => editingEvent 
                    ? setEditingEvent({ ...editingEvent, title: e.target.value })
                    : setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingEvent?.description || newEvent.description}
                  onChange={(e) => editingEvent 
                    ? setEditingEvent({ ...editingEvent, description: e.target.value })
                    : setNewEvent({ ...newEvent, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={editingEvent?.type || newEvent.type}
                    onValueChange={(value) => editingEvent 
                      ? setEditingEvent({ ...editingEvent, type: value as any })
                      : setNewEvent({ ...newEvent, type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={editingEvent?.priority || newEvent.priority}
                    onValueChange={(value) => editingEvent 
                      ? setEditingEvent({ ...editingEvent, priority: value as any })
                      : setNewEvent({ ...newEvent, priority: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editingEvent?.startTime || newEvent.startTime}
                    onChange={(e) => editingEvent 
                      ? setEditingEvent({ ...editingEvent, startTime: e.target.value })
                      : setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editingEvent?.endTime || newEvent.endTime}
                    onChange={(e) => editingEvent 
                      ? setEditingEvent({ ...editingEvent, endTime: e.target.value })
                      : setNewEvent({ ...newEvent, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editingEvent?.location || newEvent.location}
                  onChange={(e) => editingEvent 
                    ? setEditingEvent({ ...editingEvent, location: e.target.value })
                    : setNewEvent({ ...newEvent, location: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                <Input
                  id="attendees"
                  value={editingEvent?.attendees?.join(', ') || newEvent.attendees}
                  onChange={(e) => editingEvent 
                    ? setEditingEvent({ ...editingEvent, attendees: e.target.value.split(',').map(a => a.trim()) })
                    : setNewEvent({ ...newEvent, attendees: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isOnline"
                  checked={editingEvent?.isOnline || newEvent.isOnline}
                  onCheckedChange={(checked) => editingEvent 
                    ? setEditingEvent({ ...editingEvent, isOnline: checked })
                    : setNewEvent({ ...newEvent, isOnline: checked })
                  }
                />
                <Label htmlFor="isOnline">Online Meeting</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRecurring"
                  checked={editingEvent?.isRecurring || newEvent.isRecurring}
                  onCheckedChange={(checked) => editingEvent 
                    ? setEditingEvent({ ...editingEvent, isRecurring: checked })
                    : setNewEvent({ ...newEvent, isRecurring: checked })
                  }
                />
                <Label htmlFor="isRecurring">Recurring Event</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <p className="text-muted-foreground">
                  {format(parseISO(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
                  {selectedEvent.startTime && ` at ${selectedEvent.startTime}`}
                  {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                </p>
              </div>
              {selectedEvent.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline">{selectedEvent.type}</Badge>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge variant={selectedEvent.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {selectedEvent.priority}
                  </Badge>
                </div>
              </div>
              {selectedEvent.location && (
                <div>
                  <Label>Location</Label>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.location}
                  </p>
                </div>
              )}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <Label>Attendees</Label>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{selectedEvent.attendees.join(', ')}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingEvent(selectedEvent);
                    setEventDetailsOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleToggleComplete(selectedEvent.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {selectedEvent.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={aiSuggestionsOpen} onOpenChange={setAiSuggestionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Calendar Suggestions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {aiSuggestions?.suggestions?.map((suggestion: AISuggestion, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  {suggestion.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                  {suggestion.type === 'optimization' && <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />}
                  {suggestion.type === 'automation' && <Zap className="h-5 w-5 text-purple-500 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-medium">{suggestion.message}</p>
                    {suggestion.data && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(suggestion.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!aiSuggestions?.suggestions || aiSuggestions.suggestions.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No AI suggestions available at the moment.</p>
                <p className="text-sm">Create more events to get personalized recommendations.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Optimization Dialog */}
      <Dialog open={optimizationOpen} onOpenChange={setOptimizationOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Schedule Optimization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              AI will analyze your schedule and suggest optimizations for better productivity.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={format(startOfMonth(selectedDate || new Date()), 'yyyy-MM-dd')}
                  disabled
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={format(endOfMonth(selectedDate || new Date()), 'yyyy-MM-dd')}
                  disabled
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOptimizationOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleOptimizeSchedule}
                disabled={optimizeScheduleMutation.isPending}
              >
                {optimizeScheduleMutation.isPending ? 'Optimizing...' : 'Optimize Schedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring Events Dialog */}
      <Dialog open={recurringEventOpen} onOpenChange={setRecurringEventOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Create Recurring Events
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={recurringTemplate.title}
                  onChange={(e) => setRecurringTemplate({ ...recurringTemplate, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={recurringTemplate.frequency}
                  onValueChange={(value: any) => setRecurringTemplate({ ...recurringTemplate, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={recurringTemplate.description}
                onChange={(e) => setRecurringTemplate({ ...recurringTemplate, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={recurringTemplate.startDate}
                  onChange={(e) => setRecurringTemplate({ ...recurringTemplate, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={recurringTemplate.endDate}
                  onChange={(e) => setRecurringTemplate({ ...recurringTemplate, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={recurringTemplate.startTime}
                  onChange={(e) => setRecurringTemplate({ ...recurringTemplate, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={recurringTemplate.endTime}
                  onChange={(e) => setRecurringTemplate({ ...recurringTemplate, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRecurringEventOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateRecurringEvents}
                disabled={generateRecurringEventsMutation.isPending}
              >
                {generateRecurringEventsMutation.isPending ? 'Creating...' : 'Create Recurring Events'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectCalendar;
