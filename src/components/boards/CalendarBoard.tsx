import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Calendar,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Plus,
    Tag,
    Trash2,
    User
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  tags: string[];
  allDay: boolean;
}

const CalendarBoard: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Meeting',
      description: 'Weekly team standup and planning',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      status: 'scheduled',
      priority: 'high',
      assignee: 'John Doe',
      tags: ['meeting', 'planning'],
      allDay: false
    },
    {
      id: '2',
      title: 'Project Deadline',
      description: 'Final submission for Q1 project',
      date: '2024-01-20',
      startTime: '17:00',
      endTime: '18:00',
      status: 'scheduled',
      priority: 'high',
      assignee: 'Jane Smith',
      tags: ['deadline', 'project'],
      allDay: false
    },
    {
      id: '3',
      title: 'Design Review',
      description: 'Review UI/UX designs with stakeholders',
      date: '2024-01-18',
      startTime: '14:00',
      endTime: '16:00',
      status: 'scheduled',
      priority: 'medium',
      assignee: 'Mike Johnson',
      tags: ['design', 'review'],
      allDay: false
    },
    {
      id: '4',
      title: 'Company Holiday',
      description: 'Martin Luther King Jr. Day',
      date: '2024-01-16',
      status: 'scheduled',
      priority: 'low',
      tags: ['holiday'],
      allDay: true
    }
  ]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as CalendarEvent['status'],
    priority: 'medium' as CalendarEvent['priority'],
    assignee: '',
    tags: '',
    allDay: false
  });

  const handleCreateEvent = () => {
    if (newEvent.title.trim() && newEvent.date) {
      const event: CalendarEvent = {
        id: Date.now().toString(),
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        status: newEvent.status,
        priority: newEvent.priority,
        assignee: newEvent.assignee,
        tags: newEvent.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        allDay: newEvent.allDay
      };
      setEvents(prev => [...prev, event]);
      setNewEvent({ title: '', description: '', date: '', startTime: '', endTime: '', status: 'scheduled', priority: 'medium', assignee: '', tags: '', allDay: false });
      setShowCreateForm(false);
      toast.success('Event created successfully');
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
    toast.success('Event deleted');
  };

  const handleUpdateStatus = (id: string, status: CalendarEvent['status']) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === id 
          ? { ...event, status }
          : event
      )
    );
    toast.success('Status updated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

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
      days.push(new Date(year, month, day));
    }
    
    return days;
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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Calendar View</h3>
          <p className="text-sm text-muted-foreground">
            Manage your schedule and events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={view} onValueChange={(value: any) => setView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="h-4 w-4 mr-1" />
            Today
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{monthName}</h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-100 p-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const dateStr = day ? formatDate(day) : '';
              const dayEvents = day ? getEventsForDate(dateStr) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={index} 
                  className={`bg-white p-2 min-h-[100px] ${isToday ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div 
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${
                              getPriorityColor(event.priority).includes('red') ? 'bg-red-100 text-red-800' :
                              getPriorityColor(event.priority).includes('yellow') ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
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
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        <h4 className="font-medium">Upcoming Events</h4>
        <div className="space-y-2">
          {events
            .filter(event => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
            .map(event => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{event.title}</span>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <Badge className={getPriorityColor(event.priority)}>
                        {event.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select value={event.status} onValueChange={(value: any) => handleUpdateStatus(event.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    {event.startTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(event.startTime)}</span>
                      </div>
                    )}
                    {event.assignee && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{event.assignee}</span>
                      </div>
                    )}
                    {event.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-3 w-3" />
                        <div className="flex space-x-1">
                          {event.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Create New Event</CardTitle>
            <CardDescription>
              Add a new event to your calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-title">Event Title</Label>
                <Input
                  id="event-title"
                  placeholder="Enter event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                placeholder="Enter event description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="event-start-time">Start Time</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end-time">End Time</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-priority">Priority</Label>
                <Select value={newEvent.priority} onValueChange={(value: any) => setNewEvent({ ...newEvent, priority: value })}>
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
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-assignee">Assignee</Label>
                <Input
                  id="event-assignee"
                  placeholder="Enter assignee name"
                  value={newEvent.assignee}
                  onChange={(e) => setNewEvent({ ...newEvent, assignee: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-tags">Tags (comma-separated)</Label>
                <Input
                  id="event-tags"
                  placeholder="e.g. meeting, deadline, project"
                  value={newEvent.tags}
                  onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateEvent} disabled={!newEvent.title.trim() || !newEvent.date}>
                Create Event
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarBoard;

