import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Calendar,
    CheckCircle,
    Clock,
    Pause,
    Play,
    Plus,
    RotateCcw
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NoteCalendarProps {
  note: any;
  onUpdateNote: (noteId: string, updates: any) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  color: string;
}

interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  completed: boolean;
  category: string;
}

interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  completed: boolean;
  category: string;
}

const NoteCalendar: React.FC<NoteCalendarProps> = ({ note, onUpdateNote }) => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTimeBlock, setShowAddTimeBlock] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    category: 'work',
    priority: 'medium' as const
  });
  const [newTimeBlock, setNewTimeBlock] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    category: 'work'
  });
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    category: 'personal'
  });
  const [newHabit, setNewHabit] = useState({
    title: '',
    frequency: 'daily' as const,
    category: 'health'
  });

  // Pomodoro timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            // Timer finished
            setPomodoroActive(false);
            if (pomodoroMode === 'work') {
              setPomodoroMode('break');
              setPomodoroTime(5 * 60); // 5 minute break
            } else if (pomodoroMode === 'break') {
              setPomodoroMode('work');
              setPomodoroTime(25 * 60); // 25 minute work
            }
            toast.success(`Pomodoro ${pomodoroMode} session completed!`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTime, pomodoroMode]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Add event
  const addEvent = useCallback(() => {
    if (!newEvent.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    const event: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      description: newEvent.description,
      startTime: new Date(`${currentDate.toDateString()} ${newEvent.startTime}`),
      endTime: new Date(`${currentDate.toDateString()} ${newEvent.endTime}`),
      allDay: false,
      category: newEvent.category,
      priority: newEvent.priority,
      completed: false,
      color: getCategoryColor(newEvent.category)
    };

    setEvents(prev => [...prev, event]);
    setNewEvent({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      category: 'work',
      priority: 'medium'
    });
    setShowAddEvent(false);
    toast.success('Event added');
  }, [newEvent, currentDate]);

  // Add time block
  const addTimeBlock = useCallback(() => {
    if (!newTimeBlock.title.trim()) {
      toast.error('Please enter a time block title');
      return;
    }

    const timeBlock: TimeBlock = {
      id: `block-${Date.now()}`,
      title: newTimeBlock.title,
      startTime: newTimeBlock.startTime,
      endTime: newTimeBlock.endTime,
      category: newTimeBlock.category,
      completed: false
    };

    setTimeBlocks(prev => [...prev, timeBlock]);
    setNewTimeBlock({
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      category: 'work'
    });
    setShowAddTimeBlock(false);
    toast.success('Time block added');
  }, [newTimeBlock]);

  // Add goal
  const addGoal = useCallback(() => {
    if (!newGoal.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description,
      targetDate: new Date(newGoal.targetDate),
      progress: 0,
      completed: false,
      category: newGoal.category
    };

    setGoals(prev => [...prev, goal]);
    setNewGoal({
      title: '',
      description: '',
      targetDate: '',
      category: 'personal'
    });
    setShowAddGoal(false);
    toast.success('Goal added');
  }, [newGoal]);

  // Add habit
  const addHabit = useCallback(() => {
    if (!newHabit.title.trim()) {
      toast.error('Please enter a habit title');
      return;
    }

    const habit: Habit = {
      id: `habit-${Date.now()}`,
      title: newHabit.title,
      frequency: newHabit.frequency,
      streak: 0,
      completed: false,
      category: newHabit.category
    };

    setHabits(prev => [...prev, habit]);
    setNewHabit({
      title: '',
      frequency: 'daily',
      category: 'health'
    });
    setShowAddHabit(false);
    toast.success('Habit added');
  }, [newHabit]);

  // Toggle event completion
  const toggleEventCompletion = useCallback((eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, completed: !event.completed } : event
    ));
  }, []);

  // Toggle time block completion
  const toggleTimeBlockCompletion = useCallback((blockId: string) => {
    setTimeBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, completed: !block.completed } : block
    ));
  }, []);

  // Toggle goal completion
  const toggleGoalCompletion = useCallback((goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    ));
  }, []);

  // Toggle habit completion
  const toggleHabitCompletion = useCallback((habitId: string) => {
    setHabits(prev => prev.map(habit => 
      habit.id === habitId ? { ...habit, completed: !habit.completed, streak: habit.completed ? habit.streak - 1 : habit.streak + 1 } : habit
    ));
  }, []);

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      work: '#3B82F6',
      personal: '#10B981',
      health: '#F59E0B',
      learning: '#8B5CF6',
      social: '#EC4899'
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  };

  // Start/stop Pomodoro
  const togglePomodoro = useCallback(() => {
    if (pomodoroActive) {
      setPomodoroActive(false);
      toast.info('Pomodoro paused');
    } else {
      setPomodoroActive(true);
      toast.info('Pomodoro started');
    }
  }, [pomodoroActive]);

  // Reset Pomodoro
  const resetPomodoro = useCallback(() => {
    setPomodoroActive(false);
    setPomodoroMode('work');
    setPomodoroTime(25 * 60);
    toast.info('Pomodoro reset');
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Calendar & Planning</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddEvent(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTimeBlock(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Time Block
            </Button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Calendar View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar - {currentDate.toLocaleDateString()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 border rounded"
                          style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{event.title}</span>
                              <Badge variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'default' : 'secondary'}>
                                {event.priority}
                              </Badge>
                              {event.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                            </div>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            <p className="text-xs text-gray-500">
                              {event.startTime.toLocaleTimeString()} - {event.endTime.toLocaleTimeString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEventCompletion(event.id)}
                          >
                            {event.completed ? 'Undo' : 'Complete'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Time Blocks */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Time Blocks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {timeBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <span className="font-medium text-sm">{block.title}</span>
                            <p className="text-xs text-gray-500">
                              {block.startTime} - {block.endTime}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleTimeBlockCompletion(block.id)}
                          >
                            {block.completed ? 'Undo' : 'Complete'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pomodoro" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Pomodoro Timer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-6xl font-mono font-bold">
                    {formatTime(pomodoroTime)}
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant={pomodoroMode === 'work' ? 'default' : 'secondary'}>
                      {pomodoroMode === 'work' ? 'Work' : pomodoroMode === 'break' ? 'Break' : 'Long Break'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      size="lg"
                      onClick={togglePomodoro}
                      className="w-20"
                    >
                      {pomodoroActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={resetPomodoro}
                      className="w-20"
                    >
                      <RotateCcw className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Goals</h3>
              <Button onClick={() => setShowAddGoal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{goal.title}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleGoalCompletion(goal.id)}
                      >
                        {goal.completed ? 'Undo' : 'Complete'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Target: {goal.targetDate.toLocaleDateString()}</span>
                      <span>Progress: {goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="habits" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Habits</h3>
              <Button onClick={() => setShowAddHabit(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Habit
              </Button>
            </div>
            
            <div className="space-y-2">
              {habits.map((habit) => (
                <Card key={habit.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{habit.title}</span>
                        <p className="text-sm text-gray-500">
                          {habit.frequency} • Streak: {habit.streak}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleHabitCompletion(habit.id)}
                      >
                        {habit.completed ? 'Undo' : 'Complete'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Event Dialog */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Add Event</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Category</Label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="learning">Learning</option>
                    <option value="social">Social</option>
                  </select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={addEvent} className="flex-1">
                  Add Event
                </Button>
                <Button variant="outline" onClick={() => setShowAddEvent(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Time Block Dialog */}
      {showAddTimeBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Add Time Block</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newTimeBlock.title}
                  onChange={(e) => setNewTimeBlock(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Time block title"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newTimeBlock.startTime}
                    onChange={(e) => setNewTimeBlock(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newTimeBlock.endTime}
                    onChange={(e) => setNewTimeBlock(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={newTimeBlock.category}
                  onChange={(e) => setNewTimeBlock(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="learning">Learning</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <Button onClick={addTimeBlock} className="flex-1">
                  Add Time Block
                </Button>
                <Button variant="outline" onClick={() => setShowAddTimeBlock(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Dialog */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Add Goal</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Goal title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Goal description"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="health">Health</option>
                    <option value="learning">Learning</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={addGoal} className="flex-1">
                  Add Goal
                </Button>
                <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Habit Dialog */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Add Habit</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newHabit.title}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Habit title"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Frequency</Label>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={newHabit.category}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="health">Health</option>
                    <option value="productivity">Productivity</option>
                    <option value="learning">Learning</option>
                    <option value="social">Social</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={addHabit} className="flex-1">
                  Add Habit
                </Button>
                <Button variant="outline" onClick={() => setShowAddHabit(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCalendar; 