import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EventDialog from '@/components/calendar/EventDialog';
import { addDays, endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Filter, Globe, Layers, Plus, User, Users, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendarEnhanced';
import { useProjects } from '@/hooks/useProjectsEnhanced';

// Tabs will be built dynamically from real projects

// Helper for localStorage
const getLastTab = () => localStorage.getItem('calendar_last_tab') || 'all';
const setLastTab = (tab: string) => localStorage.setItem('calendar_last_tab', tab);
const getLastView = () => localStorage.getItem('calendar_last_view') || 'month';
const setLastView = (view: string) => localStorage.setItem('calendar_last_view', view);

const CalendarHub = () => {
  const [activeTab, setActiveTab] = useState(getLastTab());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day' | 'year' | 'agenda'>(getLastView() as any);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const { data: apiProjects = [] } = useProjects({});
  const projectTabs = useMemo(() => apiProjects.map(p => ({ id: p.id, label: p.name, icon: Layers })), [apiProjects]);
  const allTabs = useMemo(() => ([
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'all', label: 'All Projects', icon: Globe },
    ...projectTabs,
    { id: 'overlay', label: 'Combined', icon: Users },
  ]), [projectTabs]);

  useEffect(() => {
    setLastTab(activeTab);
  }, [activeTab]);
  useEffect(() => {
    setLastView(viewType);
  }, [viewType]);

  // derive current range
  const [rangeStart, rangeEnd] = useMemo(() => {
    switch (viewType) {
      case 'week':
        return [startOfWeek(selectedDate), endOfWeek(selectedDate)];
      case 'day':
        return [startOfDay(selectedDate), endOfDay(selectedDate)];
      case 'year':
      case 'agenda':
      case 'month':
      default:
        return [startOfMonth(selectedDate), endOfMonth(selectedDate)];
    }
  }, [selectedDate, viewType]);
  const startISO = useMemo(() => rangeStart.toISOString(), [rangeStart]);
  const endISO = useMemo(() => rangeEnd.toISOString(), [rangeEnd]);
  const selectedProjectId = useMemo(() => {
    if (activeTab === 'personal' || activeTab === 'all' || activeTab === 'overlay') return undefined;
    // if it's a project tab id
    return projectTabs.find(t => t.id === activeTab)?.id;
  }, [activeTab, projectTabs]);

  const scope = useMemo(() => {
    if (activeTab === 'personal') return 'personal';
    if (activeTab === 'all') return 'all';
    if (activeTab === 'overlay') return 'overlay';
    if (selectedProjectId) return 'project';
    return 'all';
  }, [activeTab, selectedProjectId]);

  const { data: events = [], isLoading } = useCalendarEvents(startISO, endISO, selectedProjectId, scope);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendar Hub</h1>
        <p className="text-muted-foreground">The ultimate calendar for all your work, projects, and life.</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 mb-4">
          {allTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 text-xs">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <Input placeholder="Search events/tasks..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:max-w-xs" />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button variant="outline" size="sm"><Zap className="h-4 w-4 mr-1" />Sync</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant={viewType === 'month' ? 'default' : 'outline'} onClick={() => setViewType('month')}>Month</Button>
              <Button size="sm" variant={viewType === 'week' ? 'default' : 'outline'} onClick={() => setViewType('week')}>Week</Button>
              <Button size="sm" variant={viewType === 'day' ? 'default' : 'outline'} onClick={() => setViewType('day')}>Day</Button>
              <Button size="sm" variant={viewType === 'year' ? 'default' : 'outline'} onClick={() => setViewType('year')}>Year</Button>
              <Button size="sm" variant={viewType === 'agenda' ? 'default' : 'outline'} onClick={() => setViewType('agenda')}>Agenda</Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}><CalendarIcon className="h-4 w-4 mr-1" />Today</Button>
          </div>
        </div>
        <TabsContent key={activeTab} value={activeTab} className="space-y-6">
          <AdvancedCalendar
            source={activeTab}
            viewType={viewType}
            setViewType={setViewType}
            search={search}
            events={events}
            isLoading={isLoading}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            projectId={selectedProjectId}
            onCreate={(payload: { title: string; startAt: string; endAt: string; projectId?: string; description?: string; allDay?: boolean; type?: string; reminderMinutesBefore?: number }) => {
              // Determine projectId based on active tab
              let eventProjectId: string | undefined = payload.projectId;
              if (!eventProjectId) {
                if (activeTab === 'personal') {
                  eventProjectId = undefined; // Personal event
                } else if (activeTab !== 'all' && activeTab !== 'overlay' && activeTab !== 'personal') {
                  eventProjectId = activeTab; // Project-specific tab
                }
              }
              
              createEvent.mutate({
                title: payload.title,
                description: payload.description,
                startAt: payload.startAt,
                endAt: payload.endAt,
                allDay: payload.allDay || false,
                type: (payload.type as any) || 'MEETING',
                projectId: eventProjectId,
                reminderMinutesBefore: payload.reminderMinutesBefore,
              });
            }}
            onDelete={(eventId: string) => {
              deleteEvent.mutate(eventId);
            }}
            onUpdate={(eventId: string, payload: { title?: string; startAt?: string; endAt?: string; description?: string; allDay?: boolean; type?: string; reminderMinutesBefore?: number }) => {
              const updateData: any = {};
              if (payload.title) updateData.title = payload.title;
              if (payload.description !== undefined) updateData.description = payload.description;
              if (payload.startAt) updateData.startAt = payload.startAt;
              if (payload.endAt) updateData.endAt = payload.endAt;
              if (payload.allDay !== undefined) updateData.allDay = payload.allDay;
              if (payload.type) updateData.type = payload.type;
              if (payload.reminderMinutesBefore !== undefined) updateData.reminderMinutesBefore = payload.reminderMinutesBefore;
              
              updateEvent.mutate({ id: eventId, data: updateData });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};


function AdvancedCalendar({
  source, viewType, setViewType, search,
  events, isLoading, selectedDate, setSelectedDate,
  onCreate, onDelete, onUpdate, projectId,
}: any) {
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    // Normalize backend events to local shape with performance optimization
    const normalized = (events || []).map((ev: any) => {
      const startDate = ev.startDate || ev.startAt || ev.start || '';
      const endDate = ev.endDate || ev.endAt || ev.end || '';
      const dateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
      return {
        id: ev.id,
        title: ev.title,
        description: ev.description || '',
        date: dateStr,
        start: startDate,
        end: endDate,
        allDay: ev.allDay || false,
        type: ev.type || 'OTHER',
        priority: 'medium',
        projectId: ev.projectId,
        project: ev.project,
        raw: ev,
      };
    });
    setLocalEvents(normalized);
  }, [events]);

  // Filter/search events with memoization for performance
  const filteredEvents = useMemo(() => {
    return localEvents.filter(ev => {
      if (filterType !== 'all' && ev.type !== filterType) return false;
      if (search && !(
        ev.title.toLowerCase().includes(search.toLowerCase()) ||
        ev.description?.toLowerCase().includes(search.toLowerCase())
      )) return false;
      return true;
    });
  }, [localEvents, filterType, search]);

  // Event CRUD
  const handleCreateOrEdit = (data: any) => {
    if (editingEvent) {
      // Update existing event
      onUpdate?.(editingEvent.id, { 
        title: data.title,
        startAt: data.startAt,
        endAt: data.endAt,
        description: data.description,
        allDay: data.allDay,
        type: data.type,
        reminderMinutesBefore: data.reminderMinutesBefore,
      });
    } else {
      // Create new event
      onCreate?.(data);
    }
  };
  const handleDelete = (id: string) => {
    onDelete?.(id);
    toast.success('Event deleted');
  };

  // Render views
  const renderView = () => {
    switch (viewType) {
      case 'month':
        return <MonthView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} />;
      case 'week':
        return <WeekView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} />;
      case 'day':
        return <DayView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} />;
      case 'agenda':
        return <AgendaView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} />;
      case 'year':
        return <YearView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} />;
      default:
        return null;
    }
  };

  // Render
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {source.charAt(0).toUpperCase() + source.slice(1)} Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button onClick={() => { setDialogOpen(true); setEditingEvent(null); }}><Plus className="h-4 w-4 mr-1" />Add Event</Button>
            <Input placeholder="Filter by type..." value={filterType} onChange={e => setFilterType(e.target.value)} className="w-32" />
          </div>
          {isLoading && <div className="p-2 text-sm text-muted-foreground">Loading events...</div>}
          {renderView()}
        </div>
        {/* Event Dialog (Create/Edit) */}
        {dialogOpen && (
          <EventDialog
            event={editingEvent}
            defaultProjectId={projectId}
            onSave={(data: any) => {
              handleCreateOrEdit(data);
              setDialogOpen(false);
              setEditingEvent(null);
            }}
            onClose={() => { setDialogOpen(false); setEditingEvent(null); }}
          />
        )}
        {/* Event Details/Quick Edit */}
        {editingEvent && !dialogOpen && (
          <EventDetails
            event={editingEvent}
            onEdit={() => setDialogOpen(true)}
            onDelete={() => { handleDelete(editingEvent.id); setEditingEvent(null); }}
            onClose={() => setEditingEvent(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// --- Calendar Views and Dialog Stubs ---
function MonthView({ events, selectedDate, setSelectedDate, onEventClick }: any) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
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
  
  const getEventsForDate = (day: number | null) => {
    if (day === null) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((ev: any) => ev.date === dateStr);
  };
  
  const isToday = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentDay = isToday(day);
          return (
            <div
              key={idx}
              className={`min-h-[100px] border rounded p-1 ${
                isCurrentDay ? 'bg-accent border-primary' : 'bg-background'
              } ${day === null ? 'opacity-30' : ''} cursor-pointer hover:bg-accent/50 transition-colors`}
              onClick={() => {
                if (day !== null) {
                  const newDate = new Date(year, month, day);
                  setSelectedDate(newDate);
                }
              }}
            >
              {day !== null && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event: any) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate cursor-pointer hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={event.title}
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
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function WeekView({ events, selectedDate, setSelectedDate, onEventClick }: any) {
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter((ev: any) => ev.date === dateStr);
  };
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const dayEvents = getEventsForDate(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div key={idx} className="border rounded p-2 min-h-[200px]">
              <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : ''}`}>
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-1">
                {dayEvents.map((event: any) => {
                  const startTime = event.start ? format(new Date(event.start), 'h:mm a') : 'All Day';
                  return (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                      onClick={() => onEventClick?.(event)}
                      title={`${startTime} - ${event.title}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {!event.allDay && <div className="text-[10px]">{startTime}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function DayView({ events, selectedDate, setSelectedDate, onEventClick }: any) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = events.filter((ev: any) => ev.date === dateStr);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'prev' ? -1 : 1));
  };
  
  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event: any) => {
      if (event.allDay) return false;
      const eventHour = event.start ? new Date(event.start).getHours() : null;
      return eventHour === hour;
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDay('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDay('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="border rounded">
        <div className="grid grid-cols-[80px_1fr]">
          {hours.map(hour => {
            const hourEvents = getEventsForHour(hour);
            const allDayEvents = dayEvents.filter((e: any) => e.allDay);
            return (
              <div key={hour} className="border-b grid grid-cols-[80px_1fr]">
                <div className="p-2 text-sm text-muted-foreground border-r">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="p-2 min-h-[60px]">
                  {hour === 0 && allDayEvents.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {allDayEvents.map((event: any) => (
                        <div
                          key={event.id}
                          className="text-xs p-2 rounded bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                          onClick={() => onEventClick?.(event)}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {hourEvents.map((event: any) => {
                    const startTime = event.start ? new Date(event.start) : null;
                    const endTime = event.end ? new Date(event.end) : null;
                    const duration = startTime && endTime ? (endTime.getTime() - startTime.getTime()) / (1000 * 60) : 60;
                    const height = Math.max(40, (duration / 60) * 60);
                    return (
                      <div
                        key={event.id}
                        className="text-xs p-2 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 mb-1"
                        style={{ minHeight: `${height}px` }}
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        {startTime && (
                          <div className="text-[10px]">
                            {format(startTime, 'h:mm a')} - {endTime ? format(endTime, 'h:mm a') : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function AgendaView({ events, selectedDate, setSelectedDate, onEventClick }: any) {
  const sortedEvents = [...events].sort((a: any, b: any) => {
    const dateA = a.start ? new Date(a.start) : new Date(a.date);
    const dateB = b.start ? new Date(b.start) : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  const groupedEvents = sortedEvents.reduce((acc: any, event: any) => {
    const dateStr = event.date || format(new Date(event.start || event.raw?.startAt), 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {});
  
  return (
    <div className="space-y-4">
      {Object.keys(groupedEvents).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No events scheduled</div>
      ) : (
        Object.entries(groupedEvents).map(([dateStr, dayEvents]: [string, any]) => {
          const date = new Date(dateStr);
          return (
            <div key={dateStr} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </h4>
              <div className="space-y-2">
                {dayEvents.map((event: any) => {
                  const startTime = event.start ? format(new Date(event.start), 'h:mm a') : 'All Day';
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="text-sm font-medium text-muted-foreground min-w-[80px]">
                        {startTime}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
function YearView({ events, selectedDate, setSelectedDate, onEventClick }: any) {
  const year = selectedDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  
  const getEventsForMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    return events.filter((ev: any) => {
      const eventDate = ev.date ? new Date(ev.date) : null;
      if (!eventDate) return false;
      return eventDate >= monthStart && eventDate <= monthEnd;
    });
  };
  
  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{year}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateYear('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateYear('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {months.map((monthDate, idx) => {
          const monthEvents = getEventsForMonth(monthDate);
          const isCurrentMonth = monthDate.getMonth() === new Date().getMonth() && monthDate.getFullYear() === new Date().getFullYear();
          return (
            <div
              key={idx}
              className={`border rounded p-3 cursor-pointer hover:bg-accent transition-colors ${
                isCurrentMonth ? 'border-primary bg-accent' : ''
              }`}
              onClick={() => setSelectedDate(monthDate)}
            >
              <div className="text-sm font-medium mb-2">
                {format(monthDate, 'MMM')}
              </div>
              <div className="text-xs text-muted-foreground">
                {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function EventDetails({ event, onEdit, onDelete, onClose }: any) {
  if (!event) return null;
  
  const startDate = event.start ? new Date(event.start) : new Date(event.date);
  const endDate = event.end ? new Date(event.end) : startDate;
  const isAllDay = event.allDay || event.raw?.allDay;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 p-6 rounded shadow-xl w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-semibold">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(startDate, 'EEEE, MMMM d, yyyy')}
              {!isAllDay && ` at ${format(startDate, 'h:mm a')}`}
            </span>
          </div>
          {!isAllDay && startDate.getTime() !== endDate.getTime() && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Ends:</span>
              <span>{format(endDate, 'h:mm a')}</span>
            </div>
          )}
          {event.raw?.project && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Project:</span>
              <span>{event.raw.project.name}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onEdit}>Edit</Button>
          <Button variant="destructive" onClick={onDelete}>Delete</Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default CalendarHub; 