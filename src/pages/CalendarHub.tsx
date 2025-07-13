import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Download, Filter, Focus, Globe, Layers, Moon, Plus, Star, Sun, Timer, User, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Mock data for demonstration
const PROJECTS = [
  { id: 'p1', name: 'Marketing Campaign' },
  { id: 'p2', name: 'Website Redesign' },
  { id: 'p3', name: 'Mobile App' },
  { id: 'p4', name: 'Q3 Planning' }
];
const SECTION_CALENDARS = [
  { id: 'tasks', name: 'Tasks' },
  { id: 'approvals', name: 'Approvals' },
  { id: 'forms', name: 'Forms' },
  { id: 'boards', name: 'Boards' }
];
const ALL_TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'all', label: 'All Projects', icon: Globe },
  ...PROJECTS.map(p => ({ id: p.id, label: p.name, icon: Layers })),
  ...SECTION_CALENDARS.map(s => ({ id: s.id, label: s.name, icon: Star })),
  { id: 'overlay', label: 'Combined', icon: Users }
];

// Helper for localStorage
const getLastTab = () => localStorage.getItem('calendar_last_tab') || 'all';
const setLastTab = (tab: string) => localStorage.setItem('calendar_last_tab', tab);
const getLastView = () => localStorage.getItem('calendar_last_view') || 'month';
const setLastView = (view: string) => localStorage.setItem('calendar_last_view', view);

const CalendarHub = () => {
  const [activeTab, setActiveTab] = useState(getLastTab());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day' | 'year' | 'agenda'>(getLastView() as any);
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  // ...event state, etc. (mocked for now)

  useEffect(() => {
    setLastTab(activeTab);
  }, [activeTab]);
  useEffect(() => {
    setLastView(viewType);
  }, [viewType]);

  // --- Render calendar for each tab ---
  const renderCalendar = (tab: string) => (
    <AdvancedCalendar
      key={tab}
      source={tab}
      viewType={viewType}
      setViewType={setViewType}
      search={search}
      darkMode={darkMode}
    />
  );

  return (
    <div className={darkMode ? 'dark bg-gray-900 text-white min-h-screen' : 'bg-background min-h-screen'}>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Calendar Hub</h1>
          <Button variant="ghost" size="icon" onClick={() => setDarkMode(dm => !dm)}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <p className="text-muted-foreground">The ultimate calendar for all your work, projects, and life.</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 mb-4">
          {ALL_TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 text-xs">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Input placeholder="Search events/tasks..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Button variant="outline"><Filter className="h-4 w-4 mr-1" />Filter</Button>
            <Button variant="outline"><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button variant="outline"><Zap className="h-4 w-4 mr-1" />Sync</Button>
            <Button variant="outline"><Focus className="h-4 w-4 mr-1" />Focus Mode</Button>
            <Button variant="outline"><Timer className="h-4 w-4 mr-1" />Pomodoro</Button>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant={viewType === 'month' ? 'default' : 'outline'} onClick={() => setViewType('month')}>Month</Button>
            <Button variant={viewType === 'week' ? 'default' : 'outline'} onClick={() => setViewType('week')}>Week</Button>
            <Button variant={viewType === 'day' ? 'default' : 'outline'} onClick={() => setViewType('day')}>Day</Button>
            <Button variant={viewType === 'year' ? 'default' : 'outline'} onClick={() => setViewType('year')}>Year</Button>
            <Button variant={viewType === 'agenda' ? 'default' : 'outline'} onClick={() => setViewType('agenda')}>Agenda</Button>
            <Button variant="outline" onClick={() => toast.info('Jump to date!')}><CalendarIcon className="h-4 w-4" /></Button>
          </div>
        </div>
        {ALL_TABS.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            {renderCalendar(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Mock event data generator
function generateMockEvents(source: string): any[] {
  // Each source gets its own color
  const colorMap: Record<string, string> = {
    personal: 'bg-pink-100 text-pink-800',
    all: 'bg-gray-100 text-gray-800',
    p1: 'bg-blue-100 text-blue-800',
    p2: 'bg-green-100 text-green-800',
    p3: 'bg-yellow-100 text-yellow-800',
    p4: 'bg-purple-100 text-purple-800',
    tasks: 'bg-orange-100 text-orange-800',
    approvals: 'bg-teal-100 text-teal-800',
    forms: 'bg-indigo-100 text-indigo-800',
    boards: 'bg-red-100 text-red-800',
    overlay: 'bg-gradient-to-r from-blue-200 via-pink-200 to-yellow-200 text-gray-900',
  };
  const today = new Date();
  return [
    {
      id: uuidv4(),
      title: `${source.charAt(0).toUpperCase() + source.slice(1)} Event 1`,
      description: `This is a sample event for ${source}.`,
      date: format(today, 'yyyy-MM-dd'),
      start: format(today, 'yyyy-MM-dd') + 'T10:00',
      end: format(today, 'yyyy-MM-dd') + 'T11:00',
      type: 'meeting',
      priority: 'high',
      color: colorMap[source] || 'bg-gray-100 text-gray-800',
      source
    },
    {
      id: uuidv4(),
      title: `${source.charAt(0).toUpperCase() + source.slice(1)} Event 2`,
      description: `Another event for ${source}.`,
      date: format(addDays(today, 2), 'yyyy-MM-dd'),
      start: format(addDays(today, 2), 'yyyy-MM-dd') + 'T14:00',
      end: format(addDays(today, 2), 'yyyy-MM-dd') + 'T15:00',
      type: 'task',
      priority: 'medium',
      color: colorMap[source] || 'bg-gray-100 text-gray-800',
      source
    }
  ];
}

function mergeAllEvents(tab: string) {
  if (tab === 'overlay') {
    // Combine all sources
    return [
      ...generateMockEvents('personal'),
      ...generateMockEvents('p1'),
      ...generateMockEvents('p2'),
      ...generateMockEvents('p3'),
      ...generateMockEvents('p4'),
      ...generateMockEvents('tasks'),
      ...generateMockEvents('approvals'),
      ...generateMockEvents('forms'),
      ...generateMockEvents('boards'),
    ];
  }
  if (tab === 'all') {
    return [
      ...generateMockEvents('p1'),
      ...generateMockEvents('p2'),
      ...generateMockEvents('p3'),
      ...generateMockEvents('p4'),
    ];
  }
  return generateMockEvents(tab);
}

function AdvancedCalendar({ source, viewType, setViewType, search, darkMode }: any) {
  const [events, setEvents] = useState(() => mergeAllEvents(source));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 min
  const [showMotivation, setShowMotivation] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Pomodoro timer logic
  useEffect(() => {
    if (!pomodoroActive) return;
    if (pomodoroTime === 0) {
      setPomodoroActive(false);
      toast.success('Pomodoro complete!');
      return;
    }
    const timer = setTimeout(() => setPomodoroTime(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [pomodoroActive, pomodoroTime]);

  // Filter/search events
  const filteredEvents = events.filter(ev => {
    if (filterType !== 'all' && ev.type !== filterType) return false;
    if (search && !(
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.description.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  // Event CRUD
  const handleCreateOrEdit = (event: any) => {
    if (editingEvent) {
      setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...event, id: editingEvent.id } : ev));
      toast.success('Event updated');
    } else {
      setEvents(prev => [{ ...event, id: uuidv4() }, ...prev]);
      toast.success('Event created');
    }
    setDialogOpen(false);
    setEditingEvent(null);
  };
  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
    toast.success('Event deleted');
  };

  // Drag-and-drop (mocked)
  const handleDrag = (id: string, newDate: string) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, date: newDate } : ev));
    toast.success('Event moved');
  };

  // Print/export (mocked)
  const handleExport = () => {
    toast.info('Exported calendar (mock)');
  };

  // Focus mode
  const handleFocusMode = () => {
    setFocusMode(f => !f);
    setShowMotivation(true);
    setTimeout(() => setShowMotivation(false), 5000);
  };

  // Pomodoro
  const handlePomodoro = () => {
    setPomodoroActive(a => !a);
    setPomodoroTime(25 * 60);
  };

  // Render views
  const renderView = () => {
    switch (viewType) {
      case 'month':
        return <MonthView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} onDrag={handleDrag} />;
      case 'week':
        return <WeekView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} onDrag={handleDrag} />;
      case 'day':
        return <DayView events={filteredEvents} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEventClick={setEditingEvent} onDrag={handleDrag} />;
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
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button variant={focusMode ? 'default' : 'outline'} onClick={handleFocusMode}><Focus className="h-4 w-4 mr-1" />Focus Mode</Button>
            <Button variant={pomodoroActive ? 'default' : 'outline'} onClick={handlePomodoro}><Timer className="h-4 w-4 mr-1" />Pomodoro</Button>
            <Button variant="outline" onClick={() => toast.info('Sync with Google/Outlook (mock)')}><Zap className="h-4 w-4 mr-1" />Sync</Button>
            <Button variant="outline" onClick={() => setShowMotivation(true)}><Star className="h-4 w-4 mr-1" />Motivate</Button>
            <Input placeholder="Filter by type..." value={filterType} onChange={e => setFilterType(e.target.value)} className="w-32" />
          </div>
          {showMotivation && <div className="p-2 bg-gradient-to-r from-yellow-200 via-pink-100 to-blue-100 rounded text-center font-bold animate-pulse">“Stay focused and make today amazing!”</div>}
          {pomodoroActive && <div className="p-2 bg-red-100 rounded text-center font-bold">Pomodoro: {Math.floor(pomodoroTime/60)}:{String(pomodoroTime%60).padStart(2,'0')}</div>}
          {focusMode && <div className="p-2 bg-blue-100 rounded text-center font-bold">Focus Mode: Distraction-free calendar</div>}
          {renderView()}
        </div>
        {/* Event Dialog (Create/Edit) */}
        {dialogOpen && (
          <EventDialog
            event={editingEvent}
            onSave={handleCreateOrEdit}
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
function MonthView({ events, selectedDate, setSelectedDate, onEventClick, onDrag }: any) {
  return <div className="p-4 bg-muted rounded">[Month view calendar grid with drag-and-drop and events will go here]</div>;
}
function WeekView({ events, selectedDate, setSelectedDate, onEventClick, onDrag }: any) {
  return <div className="p-4 bg-muted rounded">[Week view calendar grid with drag-and-drop and events will go here]</div>;
}
function DayView({ events, selectedDate, setSelectedDate, onEventClick, onDrag }: any) {
  return <div className="p-4 bg-muted rounded">[Day view calendar with events will go here]</div>;
}
function AgendaView({ events, selectedDate, setSelectedDate, onEventClick }: any) {
  return <div className="p-4 bg-muted rounded">[Agenda view list of events will go here]</div>;
}
function YearView({ events, selectedDate, setSelectedDate, onEventClick }: any) {
  return <div className="p-4 bg-muted rounded">[Year view calendar grid will go here]</div>;
}
function EventDialog({ event, onSave, onClose }: any) {
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-900 p-6 rounded shadow-xl w-full max-w-md">[Event create/edit dialog will go here]<button onClick={onClose} className="mt-4 btn">Close</button></div></div>;
}
function EventDetails({ event, onEdit, onDelete, onClose }: any) {
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-900 p-6 rounded shadow-xl w-full max-w-md">[Event details/quick edit will go here]<button onClick={onEdit} className="mt-4 btn">Edit</button><button onClick={onDelete} className="mt-4 btn">Delete</button><button onClick={onClose} className="mt-4 btn">Close</button></div></div>;
}

export default CalendarHub; 