
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { format, addDays, subDays, isSameDay, parseISO, formatISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  type: 'meeting' | 'task' | 'reminder' | 'event';
  priority?: 'low' | 'medium' | 'high';
}

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    description: 'Daily team standup meeting',
    date: formatISO(new Date()),
    type: 'meeting',
    priority: 'medium'
  },
  {
    id: '2',
    title: 'Product Review',
    description: 'Review new product features',
    date: formatISO(addDays(new Date(), 1)),
    type: 'meeting',
    priority: 'high'
  },
  {
    id: '3',
    title: 'Complete Project Proposal',
    description: 'Finish and submit the project proposal',
    date: formatISO(subDays(new Date(), 1)),
    type: 'task',
    priority: 'high'
  },
  {
    id: '4',
    title: 'Client Meeting',
    description: 'Meeting with client to discuss requirements',
    date: formatISO(addDays(new Date(), 3)),
    type: 'meeting'
  },
  {
    id: '5',
    title: 'Release v1.0',
    description: 'Product launch',
    date: formatISO(addDays(new Date(), 7)),
    type: 'event',
    priority: 'high'
  }
];

const CalendarPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'meeting',
    priority: 'medium'
  });
  const [viewType, setViewType] = useState<'month' | 'day'>('month');
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);

  // Function to get events for the selected day
  const updateDayEvents = (selectedDay: Date) => {
    const filtered = events.filter(event => 
      isSameDay(parseISO(event.date), selectedDay)
    );
    setDayEvents(filtered);
  };

  // Update day events when date changes
  React.useEffect(() => {
    if (selectedDate) {
      updateDayEvents(selectedDate);
    }
  }, [selectedDate, events]);

  const handleDateSelect = (day: Date | undefined) => {
    if (day) {
      setSelectedDate(day);
      updateDayEvents(day);
      
      if (viewType === 'month') {
        setViewType('day');
      }
    }
  };

  const handleCreateEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    const newCalendarEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: formatISO(selectedDate),
      type: newEvent.type as 'meeting' | 'task' | 'reminder' | 'event',
      priority: newEvent.priority as 'low' | 'medium' | 'high'
    };

    setEvents(prev => [...prev, newCalendarEvent]);
    setNewEvent({
      title: '',
      description: '',
      type: 'meeting',
      priority: 'medium'
    });
    setDialogOpen(false);
    updateDayEvents(selectedDate);
    toast.success('Event created successfully');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
    updateDayEvents(selectedDate as Date);
    toast.success('Event removed');
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'reminder':
        return 'bg-amber-100 text-amber-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return '';
    }
  };

  // Function to create highlighted dates for the calendar
  const getHighlightedDates = () => {
    const dateMap: Record<string, { backgroundColor: string, textColor: string }> = {};
    
    events.forEach(event => {
      const eventDate = format(parseISO(event.date), 'yyyy-MM-dd');
      if (event.priority === 'high') {
        dateMap[eventDate] = { backgroundColor: '#fee2e2', textColor: '#991b1b' };
      } else if (!dateMap[eventDate]) {
        dateMap[eventDate] = { backgroundColor: '#dbeafe', textColor: '#1e40af' };
      }
    });
    
    return dateMap;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Manage your schedule and events.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={viewType} onValueChange={(value: 'month' | 'day') => setViewType(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="day">Day View</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
            <span className="sr-only">Today</span>
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input 
                  id="event-title" 
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select 
                  value={newEvent.type} 
                  onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event-priority">Priority</Label>
                <Select 
                  value={newEvent.priority} 
                  onValueChange={(value) => setNewEvent(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger id="event-priority">
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
                <Label htmlFor="event-description">Description</Label>
                <Textarea 
                  id="event-description" 
                  placeholder="Event description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateEvent}>Create Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar sidebar - always visible */}
        <div className="w-full md:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  highlighted: Object.keys(getHighlightedDates()).map(date => new Date(date))
                }}
                modifiersStyles={getHighlightedDates()}
              />
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Event Types</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Meeting</Badge>
                  <Badge className="bg-green-100 text-green-800">Task</Badge>
                  <Badge className="bg-amber-100 text-amber-800">Reminder</Badge>
                  <Badge className="bg-purple-100 text-purple-800">Event</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content - changes based on view */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {viewType === 'day' && selectedDate 
                    ? format(selectedDate, 'MMMM d, yyyy') 
                    : format(date, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      if (viewType === 'day' && selectedDate) {
                        setSelectedDate(subDays(selectedDate, 1));
                      }
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      if (viewType === 'day' && selectedDate) {
                        setSelectedDate(addDays(selectedDate, 1));
                      }
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewType === 'day' ? (
                <div className="space-y-4">
                  {dayEvents.length > 0 ? (
                    dayEvents.map(event => (
                      <Card key={event.id} className="overflow-hidden">
                        <div className={cn(
                          "h-1",
                          event.priority === 'high' ? "bg-red-500" :
                          event.priority === 'medium' ? "bg-amber-500" : 
                          "bg-green-500"
                        )} />
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className={getEventBadgeColor(event.type)}>
                                {event.type}
                              </Badge>
                              {event.priority && (
                                <Badge variant="outline" className={getPriorityColor(event.priority)}>
                                  {event.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <h3 className="font-medium mb-1">No events for this day</h3>
                      <p className="text-muted-foreground mb-4">Schedule something new</p>
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <h3 className="font-medium mb-1">Click on a day to view events</h3>
                  <p className="text-muted-foreground mb-4">Or add a new event</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
