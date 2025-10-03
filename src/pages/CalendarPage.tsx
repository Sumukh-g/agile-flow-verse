import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarEvent, useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent, useUpdateCalendarEvent } from '@/hooks/useCalendar';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { Download, Plus, Search, Settings, Upload } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CalendarEventForm {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  priority: string;
  location: string;
  attendees: string[];
  isOnline: boolean;
  reminder: number;
  color: string;
  projectId: string;
}

const CalendarPage: React.FC = () => {
  console.log('CalendarPage component is rendering - FULL VERSION');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState<CalendarEventForm>({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    type: 'meeting',
    priority: 'medium',
    location: '',
    attendees: [],
    isOnline: false,
    reminder: 15,
    color: '#3b82f6',
    projectId: '',
  });

  // Fetch calendar events with error handling
  const { data: events = [], isLoading, refetch, error } = useCalendarEvents({
    search: searchTerm,
    type: filterType,
    priority: filterPriority,
  });

  console.log('Calendar events:', events); // Debug log
  console.log('Loading state:', isLoading); // Debug log
  console.log('Error state:', error); // Debug log

  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

  // Calendar navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  }, [events]);

  // Handle event form submission
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEvent) {
        await updateEventMutation.mutateAsync({
          id: editingEvent.id,
          data: {
            title: eventForm.title,
            description: eventForm.description,
            date: eventForm.date,
            startTime: eventForm.startTime,
            endTime: eventForm.endTime,
            type: eventForm.type as 'meeting' | 'task' | 'reminder' | 'event' | 'deadline' | 'appointment',
            priority: eventForm.priority as 'low' | 'medium' | 'high' | 'urgent',
            location: eventForm.location,
            attendees: eventForm.attendees,
            isOnline: eventForm.isOnline,
            reminder: eventForm.reminder,
            color: eventForm.color,
            projectId: eventForm.projectId,
          },
        });
        toast.success('Event updated successfully');
      } else {
        await createEventMutation.mutateAsync({
          title: eventForm.title,
          description: eventForm.description,
          date: eventForm.date,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime,
          type: eventForm.type as 'meeting' | 'task' | 'reminder' | 'event' | 'deadline' | 'appointment',
          priority: eventForm.priority as 'low' | 'medium' | 'high' | 'urgent',
          location: eventForm.location,
          attendees: eventForm.attendees,
          isOnline: eventForm.isOnline,
          reminder: eventForm.reminder,
          color: eventForm.color,
          projectId: eventForm.projectId,
        });
        toast.success('Event created successfully');
      }
      
      setShowEventDialog(false);
      setEditingEvent(null);
      resetEventForm();
      refetch();
    } catch (error) {
      console.error('Error saving event:', error); // Debug log
      toast.error('Failed to save event');
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEventMutation.mutateAsync(eventId);
      toast.success('Event deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting event:', error); // Debug log
      toast.error('Failed to delete event');
    }
  };

  // Reset event form
  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      type: 'meeting',
      priority: 'medium',
      location: '',
      attendees: [],
      isOnline: false,
      reminder: 15,
      color: '#3b82f6',
      projectId: '',
    });
  };

  // Open event dialog for editing
  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      priority: event.priority,
      location: event.location || '',
      attendees: event.attendees || [],
      isOnline: event.isOnline,
      reminder: event.reminder || 15,
      color: event.color || '#3b82f6',
      projectId: event.projectId || '',
    });
    setShowEventDialog(true);
  };

  // Open event dialog for creating new event
  const openCreateDialog = (date?: Date) => {
    setEditingEvent(null);
    resetEventForm();
    if (date) {
      setEventForm(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
    setShowEventDialog(true);
  };

  // Show loading state
  if (isLoading) {
    console.log('Showing loading state'); // Debug log
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2">Loading calendar...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('Showing error state:', error); // Debug log
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading calendar</div>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  console.log('Rendering main calendar content'); // Debug log

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar Hub</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your schedule and events</p>
        </div>
        <Button onClick={() => openCreateDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              →
            </Button>
          </div>

          <span className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Filters */}
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

          {/* Action Buttons */}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center font-medium text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800 text-gray-400' : ''}`}
                onClick={() => openCreateDialog(day)}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded cursor-pointer"
                      style={{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(event);
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEvent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={eventForm.type} onValueChange={(value) => setEventForm(prev => ({ ...prev, type: value }))}>
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
                <Select value={eventForm.priority} onValueChange={(value) => setEventForm(prev => ({ ...prev, priority: value }))}>
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

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location or meeting link"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={eventForm.isOnline}
                  onChange={(e) => setEventForm(prev => ({ ...prev, isOnline: e.target.checked }))}
                />
                <Label htmlFor="isOnline">Online Meeting</Label>
              </div>
              
              <div>
                <Label htmlFor="reminder">Reminder (minutes)</Label>
                <Input
                  id="reminder"
                  type="number"
                  value={eventForm.reminder}
                  onChange={(e) => setEventForm(prev => ({ ...prev, reminder: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                >
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setShowEventDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;