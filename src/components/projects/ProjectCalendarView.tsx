import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EventDialog from '@/components/calendar/EventDialog';
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
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent, useUpdateCalendarEvent } from '@/hooks/useCalendarEnhanced';

interface ProjectCalendarViewProps {
  projectId: string | undefined;
}

const ProjectCalendarView: React.FC<ProjectCalendarViewProps> = ({ projectId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  // Compute current month start/end
  const monthRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [currentDate]);

  // Use the same hook as CalendarHub for consistency and automatic cache invalidation
  const { data: rawEvents = [], isLoading: isLoadingEvents } = useCalendarEvents(
    monthRange.start,
    monthRange.end,
    projectId,
    'project'
  );

  // Transform events to match the component's expected format
  const transformedEvents = useMemo(() => {
    return rawEvents.map((e: any) => {
      const startDate = new Date(e.startDate);
      const endDate = new Date(e.endDate);
      return {
        id: e.id,
        title: e.title,
        description: e.description || '',
        date: e.startDate.slice(0, 10),
        time: e.allDay ? 'All Day' : startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: e.allDay ? '' : `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} min`,
        type: (e.type || 'OTHER').toLowerCase().replace('_', '-'),
        priority: 'medium',
        attendees: [],
        location: e.project?.name || '',
        isOnline: false,
        status: 'confirmed',
        allDay: e.allDay,
        sourceType: e.sourceType,
        sourceId: e.sourceId,
        projectId: e.projectId,
        startDate: e.startDate,
        endDate: e.endDate,
        reminderMinutesBefore: e.reminderMinutesBefore,
        project: e.project,
      };
    });
  }, [rawEvents]);

  useEffect(() => {
    setEvents(transformedEvents);
    setIsLoading(isLoadingEvents);
  }, [transformedEvents, isLoadingEvents]);

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

  const handleSaveEvent = async (data: any) => {
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id,
          data: {
            title: data.title,
            description: data.description,
            startAt: data.startAt,
            endAt: data.endAt,
            allDay: data.allDay,
            type: data.type as any,
            reminderMinutesBefore: data.reminderMinutesBefore,
          },
        });
      } else {
        await createEvent.mutateAsync({
          title: data.title,
          description: data.description,
          startAt: data.startAt,
          endAt: data.endAt,
          allDay: data.allDay,
          type: data.type as any,
          projectId,
          reminderMinutesBefore: data.reminderMinutesBefore,
        });
      }
      setIsEventDialogOpen(false);
      setEditingEvent(null);
      setPrefilledDate(undefined);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save event');
    }
  };

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
        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{event.attendees.length} attendees</span>
          </div>
        )}
      </div>
      
      {event.attendees && event.attendees.length > 0 && (
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
      )}
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        {event.sourceType && (
          <Button 
            variant="outline"
            onClick={() => {
              if (event.sourceType === 'TASK' && event.sourceId) {
                window.location.href = `/tasks?taskId=${event.sourceId}`;
              } else if (event.sourceType === 'ISSUE' && event.sourceId) {
                window.location.href = `/projects/${event.projectId}?issueId=${event.sourceId}`;
              } else if (event.sourceType === 'NOTE' && event.sourceId) {
                window.location.href = `/notes?noteId=${event.sourceId}`;
              }
            }}
          >
            View Source
          </Button>
        )}
        {!event.sourceType && (
          <>
            <Button 
              variant="outline"
              onClick={() => {
                setEditingEvent(event);
                setIsEventDialogOpen(true);
                setIsEventDetailsOpen(false);
              }}
            >
              Edit
            </Button>
            <Button 
              variant="outline"
              onClick={async () => {
                if (confirm('Are you sure you want to delete this event?')) {
                  try {
                    await deleteEvent.mutateAsync(event.id);
                    setIsEventDetailsOpen(false);
                    // Events will automatically refresh via React Query cache invalidation
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || 'Failed to delete event');
                  }
                }
              }}
              disabled={deleteEvent.isPending}
            >
              Delete
            </Button>
          </>
        )}
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
          <Button onClick={() => {
            setEditingEvent(null);
            setPrefilledDate(undefined);
            setIsEventDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
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
                    onClick={() => {
                      if (day) {
                        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        setPrefilledDate(clickedDate);
                        setEditingEvent(null);
                        setIsEventDialogOpen(true);
                      }
                    }}
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
                              onClick={(e) => {
                                e.stopPropagation();
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

          {view === 'week' && (
            <WeekViewGrid 
              currentDate={currentDate}
              events={events}
              getEventsForDate={getEventsForDate}
              getEventTypeColor={getEventTypeColor}
              getPriorityColor={getPriorityColor}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setIsEventDetailsOpen(true);
              }}
              onDateClick={(date) => {
                setPrefilledDate(date);
                setEditingEvent(null);
                setIsEventDialogOpen(true);
              }}
            />
          )}

          {view === 'day' && (
            <DayViewGrid 
              currentDate={currentDate}
              events={events}
              getEventsForDate={getEventsForDate}
              getEventTypeColor={getEventTypeColor}
              getPriorityColor={getPriorityColor}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setIsEventDetailsOpen(true);
              }}
              onAddEvent={() => {
                setPrefilledDate(currentDate);
                setEditingEvent(null);
                setIsEventDialogOpen(true);
              }}
            />
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
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      )}
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

      {/* Event Create/Edit Dialog */}
      {isEventDialogOpen && (
        <EventDialog
          event={editingEvent}
          defaultProjectId={projectId}
          defaultDate={prefilledDate}
          onSave={handleSaveEvent}
          onClose={() => {
            setIsEventDialogOpen(false);
            setEditingEvent(null);
            setPrefilledDate(undefined);
          }}
        />
      )}
    </div>
  );
};

// Week View Component
function WeekViewGrid({ 
  currentDate, 
  events, 
  getEventsForDate, 
  getEventTypeColor, 
  getPriorityColor,
  onEventClick,
  onDateClick
}: {
  currentDate: Date;
  events: any[];
  getEventsForDate: (date: string) => any[];
  getEventTypeColor: (type: string) => string;
  getPriorityColor: (priority: string) => string;
  onEventClick: (event: any) => void;
  onDateClick: (date: Date) => void;
}) {
  // Get the start of the week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const formatDateStr = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-7 gap-0">
      {/* Day headers with dates */}
      {weekDays.map((date, idx) => {
        const isToday = new Date().toDateString() === date.toDateString();
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx];
        return (
          <div key={idx} className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : ''}`}>
            <div className="text-sm text-muted-foreground">{dayName}</div>
            <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : ''}`}>{date.getDate()}</div>
          </div>
        );
      })}
      
      {/* Events for each day */}
      {weekDays.map((date, idx) => {
        const dateStr = formatDateStr(date);
        const dayEvents = getEventsForDate(dateStr);
        const isToday = new Date().toDateString() === date.toDateString();
        
        return (
          <div 
            key={idx} 
            className={`min-h-[300px] p-2 border-r cursor-pointer hover:bg-muted/30 ${isToday ? 'bg-blue-50/50' : ''}`}
            onClick={() => onDateClick(date)}
          >
            <div className="space-y-1">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`text-xs p-2 rounded border-l-2 cursor-pointer hover:shadow-sm ${
                    getEventTypeColor(event.type)
                  } ${getPriorityColor(event.priority)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-muted-foreground">{event.time}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Day View Component
function DayViewGrid({ 
  currentDate, 
  events, 
  getEventsForDate, 
  getEventTypeColor, 
  getPriorityColor,
  onEventClick,
  onAddEvent
}: {
  currentDate: Date;
  events: any[];
  getEventsForDate: (date: string) => any[];
  getEventTypeColor: (type: string) => string;
  getPriorityColor: (priority: string) => string;
  onEventClick: (event: any) => void;
  onAddEvent: () => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const dayEvents = getEventsForDate(dateStr);
  const isToday = new Date().toDateString() === currentDate.toDateString();

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event: any) => {
      if (event.allDay) return false;
      // Parse the time from event.time like "9:00 AM"
      if (event.time && event.time !== 'All Day') {
        const match = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let eventHour = parseInt(match[1]);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && eventHour !== 12) eventHour += 12;
          if (ampm === 'AM' && eventHour === 12) eventHour = 0;
          return eventHour === hour;
        }
      }
      return false;
    });
  };

  const allDayEvents = dayEvents.filter((e: any) => e.allDay || e.time === 'All Day');

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="p-4">
      {/* Date header */}
      <div className={`text-center p-4 mb-4 rounded-lg ${isToday ? 'bg-blue-50' : 'bg-muted/30'}`}>
        <div className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        {isToday && <div className="text-sm text-blue-600 font-medium">Today</div>}
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <div className="text-sm font-medium text-purple-800 mb-2">All Day Events</div>
          <div className="space-y-1">
            {allDayEvents.map((event: any) => (
              <div
                key={event.id}
                className="text-sm p-2 bg-purple-100 text-purple-800 rounded cursor-pointer hover:bg-purple-200"
                onClick={() => onEventClick(event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly grid */}
      <div className="border rounded-lg overflow-hidden">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const isCurrentHour = isToday && new Date().getHours() === hour;
          
          return (
            <div 
              key={hour} 
              className={`flex border-b last:border-b-0 min-h-[60px] ${isCurrentHour ? 'bg-blue-50' : ''}`}
            >
              <div className="w-20 p-2 text-sm text-muted-foreground border-r flex-shrink-0">
                {formatHour(hour)}
              </div>
              <div 
                className="flex-1 p-1 cursor-pointer hover:bg-muted/30"
                onClick={onAddEvent}
              >
                {hourEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className={`text-xs p-2 rounded mb-1 cursor-pointer hover:shadow-sm ${
                      getEventTypeColor(event.type)
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-muted-foreground">{event.time}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectCalendarView; 