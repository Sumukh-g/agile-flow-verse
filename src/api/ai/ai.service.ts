import { z } from 'zod';

const createTaskInput = z.object({
  title: z.string().min(1),
  projectId: z.string().min(1),
  description: z.string().optional(),
});

const summarizeNotesInput = z.object({
  noteIds: z.array(z.string()).min(1),
});

const postUpdateInput = z.object({
  message: z.string().min(1),
});

const analyzeCalendarEventInput = z.object({
  eventId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.string(),
  priority: z.string().optional(),
  duration: z.number(),
});

const getCalendarSuggestionsInput = z.object({
  events: z.array(z.any()),
  userId: z.string(),
  tenantId: z.string(),
});

const optimizeCalendarScheduleInput = z.object({
  events: z.array(z.any()),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  userId: z.string(),
  tenantId: z.string(),
});

const generateRecurringEventsInput = z.object({
  template: z.any(),
  userId: z.string(),
  tenantId: z.string(),
});

const createCalendarEventInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.string(),
  priority: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  isOnline: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z.string().optional(),
  reminder: z.number().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  projectId: z.string().optional(),
});

export type AgentRole = 'Intake' | 'Planner' | 'Comms' | 'Summarizer' | 'CalendarAssistant';

export class AiService {
  // Stubs that enforce schemas; provider integration added later
  async toolCreateTask(input: z.infer<typeof createTaskInput>) {
    createTaskInput.parse(input);
    return { ok: true, tool: 'createTask', input };
  }

  async toolSummarizeNotes(input: z.infer<typeof summarizeNotesInput>) {
    summarizeNotesInput.parse(input);
    return { ok: true, tool: 'summarizeNotes', input, summary: '(mock summary)' };
  }

  async toolPostUpdate(input: z.infer<typeof postUpdateInput>) {
    postUpdateInput.parse(input);
    return { ok: true, tool: 'postUpdate', input };
  }

  // Calendar-specific AI features
  async analyzeCalendarEvent(input: z.infer<typeof analyzeCalendarEventInput>) {
    analyzeCalendarEventInput.parse(input);
    
    // AI analysis of calendar event
    const analysis = {
      eventId: input.eventId,
      suggestions: [],
      conflicts: [],
      optimizations: [],
      insights: '',
    };

    // Analyze event title and description for better scheduling
    if (input.description) {
      const keywords = input.description.toLowerCase();
      
      // Suggest better time slots based on event type
      if (keywords.includes('meeting') || keywords.includes('call')) {
        analysis.suggestions.push('Consider scheduling during business hours (9 AM - 5 PM)');
      }
      
      if (keywords.includes('focus') || keywords.includes('deep work')) {
        analysis.suggestions.push('Schedule during your peak productivity hours');
        analysis.suggestions.push('Block 2-3 hours for uninterrupted work');
      }
      
      if (keywords.includes('review') || keywords.includes('planning')) {
        analysis.suggestions.push('Schedule at the beginning or end of the day');
      }
    }

    // Duration optimization
    if (input.duration > 120) { // More than 2 hours
      analysis.suggestions.push('Consider breaking this into smaller sessions');
    }

    // Priority-based suggestions
    if (input.priority === 'urgent') {
      analysis.suggestions.push('Schedule this as early as possible');
      analysis.suggestions.push('Set multiple reminders');
    }

    analysis.insights = `Event "${input.title}" analyzed. ${analysis.suggestions.length} suggestions generated.`;

    return analysis;
  }

  async getCalendarSuggestions(input: z.infer<typeof getCalendarSuggestionsInput>) {
    getCalendarSuggestionsInput.parse(input);
    
    const suggestions = [];
    const events = input.events;
    
    // Analyze event patterns
    const eventTypes = events.map(e => e.type);
    const priorities = events.map(e => e.priority);
    
    // Suggest time management improvements
    const urgentEvents = events.filter(e => e.priority === 'urgent');
    if (urgentEvents.length > 3) {
      suggestions.push({
        type: 'warning',
        message: 'You have many urgent events. Consider delegating some tasks.',
        action: 'review_priorities'
      });
    }
    
    // Suggest breaks between meetings
    const meetings = events.filter(e => e.type === 'meeting');
    if (meetings.length > 5) {
      suggestions.push({
        type: 'optimization',
        message: 'Add 15-minute breaks between meetings for better productivity',
        action: 'add_breaks'
      });
    }
    
    // Suggest recurring event patterns
    const recurringPatterns = this.analyzeRecurringPatterns(events);
    if (recurringPatterns.length > 0) {
      suggestions.push({
        type: 'automation',
        message: `Found ${recurringPatterns.length} potential recurring events`,
        action: 'create_recurring_events',
        data: recurringPatterns
      });
    }
    
    return { suggestions };
  }

  async optimizeCalendarSchedule(input: z.infer<typeof optimizeCalendarScheduleInput>) {
    optimizeCalendarScheduleInput.parse(input);
    
    const events = input.events;
    const optimizations = [];
    
    // Sort events by priority and duration
    const sortedEvents = events.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Shorter events first for better flexibility
      const aDuration = this.calculateDuration(a.startTime, a.endTime);
      const bDuration = this.calculateDuration(b.startTime, b.endTime);
      return aDuration - bDuration;
    });
    
    // Suggest time block optimizations
    const timeBlocks = this.createTimeBlocks(sortedEvents);
    
    // Find conflicts and suggest resolutions
    const conflicts = this.findConflicts(events);
    
    optimizations.push({
      type: 'schedule_optimization',
      message: 'Optimized event order based on priority and duration',
      data: sortedEvents
    });
    
    if (conflicts.length > 0) {
      optimizations.push({
        type: 'conflict_resolution',
        message: `Found ${conflicts.length} scheduling conflicts`,
        data: conflicts
      });
    }
    
    return {
      optimized: true,
      optimizations,
      suggestedSchedule: sortedEvents,
      timeBlocks
    };
  }

  async generateRecurringEvents(input: z.infer<typeof generateRecurringEventsInput>) {
    generateRecurringEventsInput.parse(input);
    
    const { template, userId, tenantId } = input;
    const events = [];
    
    // Generate recurring events based on template
    const startDate = new Date(template.startDate);
    const endDate = new Date(template.endDate);
    const frequency = template.frequency || 'weekly';
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const event = {
        title: template.title,
        description: template.description,
        date: currentDate.toISOString().split('T')[0],
        startTime: template.startTime,
        endTime: template.endTime,
        type: template.type,
        priority: template.priority,
        location: template.location,
        attendees: template.attendees,
        isOnline: template.isOnline,
        isRecurring: true,
        recurrence: frequency,
        reminder: template.reminder,
        color: template.color,
        projectId: template.projectId,
      };
      
      events.push(event);
      
      // Move to next occurrence
      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
    
    return events;
  }

  async createCalendarEvent(input: z.infer<typeof createCalendarEventInput>) {
    createCalendarEventInput.parse(input);
    
    // AI-enhanced event creation
    const enhancedEvent = {
      ...input,
      // AI suggestions for better event details
      suggestions: [],
      autoGenerated: true
    };
    
    // Enhance event based on title and description
    if (input.title.toLowerCase().includes('meeting')) {
      enhancedEvent.suggestions.push('Consider adding agenda items');
      enhancedEvent.suggestions.push('Set up video call link if online');
    }
    
    if (input.title.toLowerCase().includes('review')) {
      enhancedEvent.suggestions.push('Prepare materials in advance');
      enhancedEvent.suggestions.push('Set follow-up action items');
    }
    
    return enhancedEvent;
  }

  // Helper methods
  private analyzeRecurringPatterns(events: any[]) {
    const patterns = [];
    const eventGroups = {};
    
    // Group events by title similarity
    events.forEach(event => {
      const key = event.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });
    
    // Find potential recurring patterns
    Object.entries(eventGroups).forEach(([key, groupEvents]: [string, any]) => {
      if (groupEvents.length >= 2) {
        const dates = groupEvents.map(e => new Date(e.date)).sort();
        const intervals = [];
        
        for (let i = 1; i < dates.length; i++) {
          const interval = Math.round((dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24));
          intervals.push(interval);
        }
        
        // Check if intervals are consistent
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const isConsistent = intervals.every(interval => Math.abs(interval - avgInterval) <= 2);
        
        if (isConsistent) {
          patterns.push({
            title: groupEvents[0].title,
            frequency: this.determineFrequency(avgInterval),
            events: groupEvents,
            suggestedTemplate: {
              title: groupEvents[0].title,
              description: groupEvents[0].description,
              startTime: groupEvents[0].startTime,
              endTime: groupEvents[0].endTime,
              type: groupEvents[0].type,
              priority: groupEvents[0].priority,
              frequency: this.determineFrequency(avgInterval)
            }
          });
        }
      }
    });
    
    return patterns;
  }

  private determineFrequency(avgInterval: number): string {
    if (avgInterval <= 1) return 'daily';
    if (avgInterval <= 7) return 'weekly';
    if (avgInterval <= 30) return 'monthly';
    return 'yearly';
  }

  private createTimeBlocks(events: any[]) {
    const timeBlocks = [];
    let currentBlock = null;
    
    events.forEach(event => {
      if (!currentBlock) {
        currentBlock = {
          start: event.startTime,
          end: event.endTime,
          events: [event]
        };
      } else {
        // Check if event can fit in current block
        if (event.startTime >= currentBlock.end) {
          timeBlocks.push(currentBlock);
          currentBlock = {
            start: event.startTime,
            end: event.endTime,
            events: [event]
          };
        } else {
          currentBlock.events.push(event);
          currentBlock.end = event.endTime;
        }
      }
    });
    
    if (currentBlock) {
      timeBlocks.push(currentBlock);
    }
    
    return timeBlocks;
  }

  private findConflicts(events: any[]) {
    const conflicts = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        if (event1.date === event2.date) {
          const start1 = event1.startTime;
          const end1 = event1.endTime;
          const start2 = event2.startTime;
          const end2 = event2.endTime;
          
          if (start1 < end2 && start2 < end1) {
            conflicts.push({
              event1,
              event2,
              conflictType: 'time_overlap',
              severity: 'high'
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  private calculateDuration(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
  }
} 