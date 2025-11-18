import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Filter,
    MapPin,
    Plus,
    Users,
    Video
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface ProjectCalendarViewProps {
  projectId: string | undefined;
}

const ProjectCalendarView: React.FC<ProjectCalendarViewProps> = ({ projectId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  // Compute current month start/end
  const monthRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    // ISO strings
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [currentDate]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!projectId) {
          setEvents([]);
          return;
        }
        const raw = await api.calendar.getEvents(monthRange.start, monthRange.end, projectId);
        if (cancelled) return;
        const mapped = raw.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: (e.startDate || e.start || '').slice(0, 10),
          time: '',
          duration: '',
          type: e.type || 'task',
          priority: e.priority || 'medium',
          attendees: (e.assignees || []).map((a: any) => a.name || a.email).filter(Boolean),
          location: e.project?.name || '',
          isOnline: false,
          status: e.status || 'confirmed',
        }));
        setEvents(mapped);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to load calendar events');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId, monthRange.start, monthRange.end]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'planning': return 'bg-green-100 text-green-800 border-green-200';
      case 'presentation': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'tentative': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const AddEventForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" placeholder="Enter event title" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Event description..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" />
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input id="duration" placeholder="e.g., 2 hours" />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="presentation">Presentation</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="Meeting location" />
        </div>
      </div>
      <div>
        <Label htmlFor="attendees">Attendees</Label>
        <Input id="attendees" placeholder="Enter attendee names (comma separated)" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>Cancel</Button>
        <Button onClick={async () => {
          // Create a task to appear on the calendar
          const titleEl = document.getElementById('title') as HTMLInputElement | null;
          const dateEl = document.getElementById('date') as HTMLInputElement | null;
          const timeEl = document.getElementById('time') as HTMLInputElement | null;
          const descriptionEl = document.getElementById('description') as HTMLTextAreaElement | null;
          if (!titleEl?.value || !dateEl?.value) {
            toast.error('Title and date are required');
            return;
          }
          const dueDateIso = timeEl?.value ? `${dateEl.value}T${timeEl.value}:00.000Z` : new Date(dateEl.value).toISOString();
          try {
            await api.tasks.createTask({
              title: titleEl.value,
              description: descriptionEl?.value,
              projectId,
              dueDate: dueDateIso,
              priority: 'medium',
              status: 'todo',
            } as any);
            toast.success('Event added successfully!');
            setIsAddEventOpen(false);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to add event');
          }
        }}>Add Event</Button>
      </div>
    </div>
  );

  const EventDetails = ({ event }: { event: any }) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{event.title}</h3>
          <p className="text-muted-foreground">{event.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(event.status)}
          <Badge className={getEventTypeColor(event.type)}>
            {event.type}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{event.time} ({event.duration})</span>
        </div>
        <div className="flex items-center gap-2">
          {event.isOnline ? (
            <Video className="h-4 w-4 text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{event.attendees.length} attendees</span>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Attendees</h4>
        <div className="flex flex-wrap gap-2">
          {event.attendees.map((attendee: string, index: number) => (
            <Badge key={index} variant="secondary">
              {attendee}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={() => {
            setIsAddEventOpen(true);
            toast.info(`Editing event: ${event.title}`);
          }}
        >
          Edit
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            if (confirm('Are you sure you want to delete this event?')) {
              setEvents(prev => prev.filter(e => e.id !== event.id));
              toast.success('Event deleted successfully');
              setIsEventDetailsOpen(false);
            }
          }}
        >
          Delete
        </Button>
        <Button
          onClick={() => {
            if (event.isOnline) {
              toast.info(`Joining online meeting: ${event.title}`);
            } else {
              toast.info(`Event location: ${event.location}`);
            }
          }}
        >
          {event.isOnline ? 'Join Meeting' : 'View Location'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Calendar</h2>
          <p className="text-muted-foreground">Schedule and track project events, meetings, and deadlines</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => toast.info('Filter events coming soon')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button 
            variant="outline"
            onClick={() => toast.info('Exporting calendar...')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>
                  Create a new calendar event for your project
                </DialogDescription>
              </DialogHeader>
              <AddEventForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold min-w-[200px] text-center">
              {formatDate(currentDate)}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={view === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button 
            variant={view === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button 
            variant={view === 'day' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('day')}
          >
            Day
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {view === 'month' && (
            <div className="grid grid-cols-7 gap-0">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-3 text-center font-medium text-muted-foreground border-b">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getDaysInMonth(currentDate).map((day, index) => {
                const dateStr = day ? 
                  `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` 
                  : '';
                const dayEvents = day ? getEventsForDate(dateStr) : [];
                const isToday = day && 
                  new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-[120px] p-2 border-b border-r ${
                      day ? 'hover:bg-muted/50 cursor-pointer' : 'bg-muted/20'
                    } ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded border-l-2 cursor-pointer hover:shadow-sm ${
                                getEventTypeColor(event.type)
                              } ${getPriorityColor(event.priority)}`}
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsEventDetailsOpen(true);
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-muted-foreground">{event.time}</div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next events in your project calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div 
                key={event.id} 
                className={`p-4 border rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                  getPriorityColor(event.priority)
                }`}
                onClick={() => {
                  setSelectedEvent(event);
                  setIsEventDetailsOpen(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                      {getStatusIcon(event.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{event.attendees.length} attendees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {event.isOnline ? (
                          <Video className="h-3 w-3" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventDetails event={selectedEvent} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectCalendarView; 