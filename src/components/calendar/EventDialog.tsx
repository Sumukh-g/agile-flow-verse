/**
 * EventDialog Component
 * 
 * A comprehensive modal dialog for creating and editing calendar events.
 * Features tabbed navigation for organizing event details into logical sections:
 * - Details: Title, description, type, and color
 * - Time & Date: Start/end dates, times, reminders, and recurrence
 * - Location: Physical location and video conferencing links
 * - Attendees: Manage event participants
 * - Options: Privacy and notification settings
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Plus, Video, X } from 'lucide-react';
import { useState, useCallback, MouseEvent } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the EventDialog component
 */
export interface EventDialogProps {
  /** Existing event data when editing (undefined for new events) */
  event?: any;
  /** Default project ID to associate with the event */
  defaultProjectId?: string;
  /** Default date for the event (used when clicking on a calendar day) */
  defaultDate?: Date;
  /** Callback function when saving the event */
  onSave: (data: {
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    allDay: boolean;
    type: string;
    projectId?: string;
    location?: string;
    videoLink?: string;
    reminderMinutesBefore?: number;
    attendees?: string[];
  }) => void;
  /** Callback function when closing the dialog */
  onClose: () => void;
}

// ============================================================================
// COLOR OPTIONS FOR EVENT CUSTOMIZATION
// ============================================================================

const EVENT_COLORS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EventDialog({ event, defaultProjectId, defaultDate, onSave, onClose }: EventDialogProps) {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  // Determine if we're editing an existing event or creating a new one
  const isEditing = !!event;

  // Event basic details
  const [eventTitle, setEventTitle] = useState(event?.title || event?.raw?.title || '');
  const [eventDescription, setEventDescription] = useState(event?.description || event?.raw?.description || '');
  
  // Date and time state - Initialize from event data or defaults
  const [startDate, setStartDate] = useState<Date>(() => {
    // Priority order for date initialization:
    // 1. Default date passed as prop (e.g., from clicking a calendar day)
    // 2. Event's date field
    // 3. Event's start field
    // 4. Event's startDate field
    // 5. Event's raw startAt field
    // 6. Current date as fallback
    if (defaultDate) return defaultDate;
    if (event?.date) return new Date(event.date);
    if (event?.start) return new Date(event.start);
    if (event?.startDate) return new Date(event.startDate);
    if (event?.raw?.startAt) return new Date(event.raw.startAt);
    return new Date();
  });

  // Parse start time from existing event or default to 9:00 AM
  const [startTime, setStartTime] = useState(() => {
    // Try to parse time from various event formats
    if (event?.time && event.time !== 'All Day') {
      // Parse "HH:MM AM/PM" format
      const match = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const ampm = match[3].toUpperCase();
        // Convert to 24-hour format
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      }
    }
    // Try to extract from start date
    if (event?.start) {
      const d = new Date(event.start);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '09:00'; // Default: 9:00 AM
  });

  // Parse end time from existing event or default to 10:00 AM
  const [endTime, setEndTime] = useState(() => {
    if (event?.end || event?.endDate) {
      const endDate = new Date(event.end || event.endDate);
      return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    }
    return '10:00'; // Default: 10:00 AM (1 hour after start)
  });

  // All-day event toggle
  const [allDay, setAllDay] = useState(event?.allDay || event?.raw?.allDay || false);
  
  // Location and video conferencing
  const [location, setLocation] = useState(event?.location || '');
  const [videoLink, setVideoLink] = useState(event?.videoLink || '');
  
  // Event type and appearance
  const [eventType, setEventType] = useState(() => {
    if (event?.type) {
      // Normalize type to uppercase with underscores
      return event.type.toUpperCase().replace('-', '_');
    }
    return 'MEETING';
  });
  const [eventColor, setEventColor] = useState('blue');
  
  // Reminder and recurrence settings
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(
    event?.reminderMinutesBefore || 15
  );
  const [recurrence, setRecurrence] = useState('none');
  
  // Attendees management
  const [attendees, setAttendees] = useState<string[]>(event?.attendees || []);
  const [newAttendee, setNewAttendee] = useState('');
  
  // Current active tab in the dialog
  const [activeTab, setActiveTab] = useState('details');

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Stops event propagation to prevent the dialog from closing
   * when clicking inside the dialog content
   */
  const handleDialogClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  /**
   * Handles backdrop click to close the dialog
   * Only closes if clicking directly on the backdrop, not its children
   */
  const handleBackdropClick = useCallback((e: MouseEvent) => {
    // Only close if clicking the backdrop itself, not children
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  /**
   * Adds a new attendee to the list
   * Validates that the email is not empty and not already added
   */
  const handleAddAttendee = useCallback(() => {
    const trimmedEmail = newAttendee.trim();
    if (trimmedEmail && !attendees.includes(trimmedEmail)) {
      setAttendees(prev => [...prev, trimmedEmail]);
      setNewAttendee('');
    }
  }, [newAttendee, attendees]);

  /**
   * Removes an attendee from the list
   */
  const handleRemoveAttendee = useCallback((email: string) => {
    setAttendees(prev => prev.filter(a => a !== email));
  }, []);

  /**
   * Handles the save action
   * Validates required fields and constructs the event data
   */
  const handleSave = useCallback(() => {
    // Validate required fields
    if (!eventTitle.trim()) {
      toast.error('Event title is required');
      return;
    }

    // Calculate start and end date/times based on all-day setting
    const startDateTime = allDay
      ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
      : new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}:00`);
    
    const endDateTime = allDay
      ? new Date(new Date(startDate).setHours(23, 59, 59, 999))
      : new Date(`${format(startDate, 'yyyy-MM-dd')}T${endTime}:00`);

    // Validate that end time is after start time (for non-all-day events)
    if (endDateTime <= startDateTime && !allDay) {
      toast.error('End time must be after start time');
      return;
    }

    // Call the onSave callback with the event data
    onSave({
      title: eventTitle,
      description: eventDescription || undefined,
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      allDay,
      type: eventType,
      location: location || undefined,
      videoLink: videoLink || undefined,
      reminderMinutesBefore: reminderMinutes,
      attendees,
      projectId: defaultProjectId,
    });
  }, [
    eventTitle, eventDescription, startDate, startTime, endTime, 
    allDay, eventType, location, videoLink, reminderMinutes, 
    attendees, defaultProjectId, onSave
  ]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    // Backdrop overlay - clicking here closes the dialog
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* Dialog container - clicks here should NOT close the dialog */}
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={handleDialogClick}
      >
        {/* ================================================================ */}
        {/* HEADER SECTION */}
        {/* ================================================================ */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing ? 'Update your event details' : 'Schedule your event with all the details'}
            </p>
          </div>
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="rounded-full"
            type="button"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ================================================================ */}
        {/* TABS NAVIGATION AND CONTENT */}
        {/* ================================================================ */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 overflow-hidden flex flex-col"
        >
          {/* Tab navigation buttons */}
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="time">Time & Date</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          {/* Scrollable content area for tab panels */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* ============================================================ */}
            {/* DETAILS TAB - Basic event information */}
            {/* ============================================================ */}
            <TabsContent value="details" className="space-y-6 mt-0">
              {/* Event Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Event Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter event title"
                  className="h-12 text-lg"
                  autoFocus
                />
              </div>

              {/* Event Description Textarea */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Add a detailed description for your event..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Event Type and Color Selection */}
              <div className="grid grid-cols-2 gap-4">
                {/* Event Type Dropdown */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEETING">📅 Meeting</SelectItem>
                      <SelectItem value="TASK_DEADLINE">✅ Task Deadline</SelectItem>
                      <SelectItem value="ISSUE_DUE">🐛 Issue Due</SelectItem>
                      <SelectItem value="REMINDER">🔔 Reminder</SelectItem>
                      <SelectItem value="NOTE_DATE">📝 Note Date</SelectItem>
                      <SelectItem value="OTHER">📌 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Color</Label>
                  <div className="flex gap-2">
                    {EVENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventColor(color.value);
                        }}
                        className={`w-10 h-10 rounded-full ${color.class} border-2 transition-all ${
                          eventColor === color.value 
                            ? 'border-gray-900 dark:border-white scale-110' 
                            : 'border-transparent'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ============================================================ */}
            {/* TIME & DATE TAB - Scheduling options */}
            {/* ============================================================ */}
            <TabsContent value="time" className="space-y-6 mt-0">
              {/* All-Day Event Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="all-day"
                  checked={allDay}
                  onCheckedChange={setAllDay}
                />
                <Label htmlFor="all-day" className="text-base font-semibold cursor-pointer">
                  All Day Event
                </Label>
              </div>

              {/* Start Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date Picker */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-11"
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Start Time Input (hidden for all-day events) */}
                {!allDay && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-11"
                    />
                  </div>
                )}
              </div>

              {/* End Date and Time (hidden for all-day events) */}
              {!allDay && (
                <div className="grid grid-cols-2 gap-4">
                  {/* End Date Picker */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-11"
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(startDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[100]" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Time Input */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Reminder and Recurrence Settings */}
              <div className="space-y-4">
                {/* Reminder Dropdown */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Reminder</Label>
                  <Select
                    value={reminderMinutes?.toString() || 'none'}
                    onValueChange={(v) => setReminderMinutes(v === 'none' ? undefined : parseInt(v))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No reminder</SelectItem>
                      <SelectItem value="0">At event time</SelectItem>
                      <SelectItem value="5">5 minutes before</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recurrence Dropdown */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Recurrence</Label>
                  <Select value={recurrence} onValueChange={setRecurrence}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* ============================================================ */}
            {/* LOCATION TAB - Physical and virtual meeting locations */}
            {/* ============================================================ */}
            <TabsContent value="location" className="space-y-6 mt-0">
              {/* Physical Location Input */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location or address"
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Video Conferencing Link Input */}
              <div className="space-y-2">
                <Label htmlFor="video-link" className="text-base font-semibold">
                  Video Conferencing
                </Label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="video-link"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="Add Zoom, Teams, or Google Meet link"
                    className="h-11 pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Add a video conferencing link for online meetings
                </p>
              </div>
            </TabsContent>

            {/* ============================================================ */}
            {/* ATTENDEES TAB - Manage event participants */}
            {/* ============================================================ */}
            <TabsContent value="attendees" className="space-y-6 mt-0">
              {/* Add Attendee Input */}
              <div className="space-y-2">
                <Label htmlFor="attendee-email" className="text-base font-semibold">
                  Add Attendees
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="attendee-email"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    placeholder="Enter email address"
                    className="h-11"
                    onKeyDown={(e) => {
                      // Allow adding attendee with Enter key
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAttendee();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleAddAttendee} 
                    className="h-11"
                    type="button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Attendees List */}
              {attendees.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Attendees ({attendees.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {attendees.map((email) => (
                      <Badge 
                        key={email} 
                        variant="secondary" 
                        className="px-3 py-1.5 text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttendee(email);
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state message */}
              {attendees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No attendees added yet.</p>
                  <p className="text-sm">Add email addresses to invite people to this event.</p>
                </div>
              )}
            </TabsContent>

            {/* ============================================================ */}
            {/* OPTIONS TAB - Privacy and notification settings */}
            {/* ============================================================ */}
            <TabsContent value="options" className="space-y-6 mt-0">
              <div className="space-y-4">
                {/* Private Event Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Private Event</Label>
                    <p className="text-xs text-muted-foreground">
                      Only you can see this event
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                {/* Send Notifications Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Send Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify attendees via email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </TabsContent>
          </div>

          {/* ================================================================ */}
          {/* FOOTER - Action buttons */}
          {/* ================================================================ */}
          <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!eventTitle.trim()} 
              className="px-8"
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default EventDialog;
