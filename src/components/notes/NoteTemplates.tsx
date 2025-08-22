import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    FileText,
    Plus,
    Save,
    Search,
    Target,
    XCircle
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface NoteTemplatesProps {
  note: any;
  onUpdateNote: (noteId: string, updates: any) => void;
}

const NoteTemplates: React.FC<NoteTemplatesProps> = ({ note, onUpdateNote }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Template categories
  const templateCategories = {
    general: [
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Structured template for meeting documentation',
        icon: FileText,
        content: `# Meeting Notes

## Meeting Details
- **Date:** ${new Date().toLocaleDateString()}
- **Time:** ${new Date().toLocaleTimeString()}
- **Location:** 
- **Attendees:** 

## Agenda
1. 
2. 
3. 

## Discussion Points
### Topic 1
- 

### Topic 2
- 

## Action Items
- [ ] 
- [ ] 
- [ ] 

## Next Steps
- 

## Notes
- 

---
*Generated on ${new Date().toLocaleDateString()}*`
      },
      {
        id: 'project-plan',
        name: 'Project Plan',
        description: 'Comprehensive project planning template',
        icon: Target,
        content: `# Project Plan

## Project Overview
- **Project Name:** 
- **Start Date:** 
- **End Date:** 
- **Project Manager:** 
- **Stakeholders:** 

## Project Goals
1. 
2. 
3. 

## Scope
### In Scope
- 

### Out of Scope
- 

## Timeline
### Phase 1: Planning
- [ ] 
- [ ] 
- [ ] 

### Phase 2: Development
- [ ] 
- [ ] 
- [ ] 

### Phase 3: Testing
- [ ] 
- [ ] 
- [ ] 

### Phase 4: Deployment
- [ ] 
- [ ] 
- [ ] 

## Resources
- **Team Members:** 
- **Budget:** 
- **Tools:** 

## Risks & Mitigation
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
|      |        |             |            |

## Success Metrics
- 
- 
- 

---
*Created on ${new Date().toLocaleDateString()}*`
      },
      {
        id: 'task-list',
        name: 'Task List',
        description: 'Simple task management template',
        icon: CheckCircle,
        content: `# Task List

## Priority Tasks
### High Priority
- [ ] 
- [ ] 
- [ ] 

### Medium Priority
- [ ] 
- [ ] 
- [ ] 

### Low Priority
- [ ] 
- [ ] 
- [ ] 

## Completed Tasks
- [x] 
- [x] 

## Notes
- 

---
*Last updated: ${new Date().toLocaleDateString()}*`
      }
    ],
    planning: [
      {
        id: 'daily-planner',
        name: 'Daily Planner',
        description: 'Daily schedule and task management',
        icon: Calendar,
        content: `# Daily Planner - ${new Date().toLocaleDateString()}

## Today's Goals
1. 
2. 
3. 

## Schedule
| Time | Activity | Status |
|------|----------|--------|
| 9:00 AM | | |
| 10:00 AM | | |
| 11:00 AM | | |
| 12:00 PM | Lunch | |
| 1:00 PM | | |
| 2:00 PM | | |
| 3:00 PM | | |
| 4:00 PM | | |
| 5:00 PM | | |

## Tasks
### Morning
- [ ] 
- [ ] 
- [ ] 

### Afternoon
- [ ] 
- [ ] 
- [ ] 

### Evening
- [ ] 
- [ ] 
- [ ] 

## Notes & Ideas
- 

## Tomorrow's Preparation
- [ ] 
- [ ] 

---
*Daily planner for ${new Date().toLocaleDateString()}*`
      },
      {
        id: 'weekly-planner',
        name: 'Weekly Planner',
        description: 'Weekly planning and goal setting',
        icon: Calendar,
        content: `# Weekly Planner - Week of ${new Date().toLocaleDateString()}

## Weekly Goals
1. 
2. 
3. 

## Daily Breakdown

### Monday
**Focus:** 
**Tasks:**
- [ ] 
- [ ] 
- [ ] 

### Tuesday
**Focus:** 
**Tasks:**
- [ ] 
- [ ] 
- [ ] 

### Wednesday
**Focus:** 
**Tasks:**
- [ ] 
- [ ] 
- [ ] 

### Thursday
**Focus:** 
**Tasks:**
- [ ] 
- [ ] 
- [ ] 

### Friday
**Focus:** 
**Tasks:**
- [ ] 
- [ ] 
- [ ] 

### Weekend
**Focus:** 
**Tasks:**
- [ ] 
- [ ] 
- [ ] 

## Weekly Review
### Accomplishments
- 

### Challenges
- 

### Next Week's Focus
- 

---
*Weekly planner for ${new Date().toLocaleDateString()}*`
      },
      {
        id: 'monthly-planner',
        name: 'Monthly Planner',
        description: 'Monthly goal setting and planning',
        icon: Calendar,
        content: `# Monthly Planner - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

## Monthly Goals
### Primary Goals
1. 
2. 
3. 

### Secondary Goals
1. 
2. 
3. 

## Key Events & Deadlines
| Date | Event | Notes |
|------|-------|-------|
| | | |
| | | |
| | | |

## Weekly Focus Areas
### Week 1
- Focus: 
- Key Tasks:
  - [ ] 
  - [ ] 

### Week 2
- Focus: 
- Key Tasks:
  - [ ] 
  - [ ] 

### Week 3
- Focus: 
- Key Tasks:
  - [ ] 
  - [ ] 

### Week 4
- Focus: 
- Key Tasks:
  - [ ] 
  - [ ] 

## Habit Tracking
| Habit | Week 1 | Week 2 | Week 3 | Week 4 |
|-------|--------|--------|--------|--------|
| | | | | |
| | | | | |

## Monthly Review
### Achievements
- 

### Lessons Learned
- 

### Next Month's Focus
- 

---
*Monthly planner for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*`
      }
    ],
    pomodoro: [
      {
        id: 'pomodoro-session',
        name: 'Pomodoro Session',
        description: 'Pomodoro technique session tracker',
        icon: Clock,
        content: `# Pomodoro Session - ${new Date().toLocaleDateString()}

## Session Goal
**Focus:** 

## Pomodoro Blocks
### Block 1 (25 min)
- [ ] Start: 
- [ ] End: 
- [ ] Break: 
- [ ] Notes: 

### Block 2 (25 min)
- [ ] Start: 
- [ ] End: 
- [ ] Break: 
- [ ] Notes: 

### Block 3 (25 min)
- [ ] Start: 
- [ ] End: 
- [ ] Break: 
- [ ] Notes: 

### Block 4 (25 min)
- [ ] Start: 
- [ ] End: 
- [ ] Long Break: 
- [ ] Notes: 

## Session Summary
- **Total Focus Time:** 100 minutes
- **Completed Tasks:** 
- **Distractions:** 
- **Productivity Level:** 

## Next Session
- **Focus Area:** 
- **Prepared Tasks:** 

---
*Pomodoro session on ${new Date().toLocaleDateString()}*`
      }
    ],
    habits: [
      {
        id: 'habit-tracker',
        name: 'Habit Tracker',
        description: 'Daily habit tracking template',
        icon: Target,
        content: `# Habit Tracker - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

## Habits to Track
| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Weekly Goal |
|-------|-----|-----|-----|-----|-----|-----|-----|-------------|
| Exercise | □ | □ | □ | □ | □ | □ | □ | 5 days |
| Read | □ | □ | □ | □ | □ | □ | □ | 7 days |
| Meditate | □ | □ | □ | □ | □ | □ | □ | 7 days |
| Drink Water | □ | □ | □ | □ | □ | □ | □ | 7 days |
| Sleep 8h | □ | □ | □ | □ | □ | □ | □ | 6 days |

## Weekly Progress
### Week 1
- Exercise: /5
- Read: /7
- Meditate: /7
- Drink Water: /7
- Sleep 8h: /6

### Week 2
- Exercise: /5
- Read: /7
- Meditate: /7
- Drink Water: /7
- Sleep 8h: /6

### Week 3
- Exercise: /5
- Read: /7
- Meditate: /7
- Drink Water: /7
- Sleep 8h: /6

### Week 4
- Exercise: /5
- Read: /7
- Meditate: /7
- Drink Water: /7
- Sleep 8h: /6

## Monthly Summary
- **Best Habit:** 
- **Needs Improvement:** 
- **Next Month's Focus:** 

---
*Habit tracker for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*`
      }
    ]
  };

  // Apply template
  const applyTemplate = useCallback((template: any) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  }, []);

  // Use template
  const useTemplate = useCallback((template: any) => {
    onUpdateNote(note.id, {
      content: template.content,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      templateUsed: template.id,
      templateAppliedAt: new Date()
    });
    toast.success(`Applied ${template.name} template`);
    setShowPreview(false);
    setSelectedTemplate(null);
  }, [note.id, onUpdateNote]);

  // Create custom template
  const createCustomTemplate = useCallback(() => {
    if (!templateName.trim() || !customTemplate.trim()) {
      toast.error('Please provide both template name and content');
      return;
    }

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: 'Custom template',
      icon: FileText,
      content: customTemplate,
      isCustom: true
    };

    // Here you would save the custom template
    toast.success('Custom template created');
    setTemplateName('');
    setCustomTemplate('');
    setIsCreating(false);
  }, [templateName, customTemplate]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const category = templateCategories[activeTab as keyof typeof templateCategories] || [];
    if (!searchQuery) return category;
    
    return category.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Note Templates</h2>
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Create Custom Template */}
      {isCreating && (
        <div className="p-4 border-b bg-white dark:bg-gray-800">
          <h3 className="font-medium mb-4">Create Custom Template</h3>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <Label>Template Content</Label>
              <textarea
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                placeholder="Enter template content..."
                className="w-full h-32 p-2 border rounded resize-none"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={createCustomTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => applyTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <template.icon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        useTemplate(template);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Preview */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[800px] h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{selectedTemplate.name}</h3>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto mb-4">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded">
                {selectedTemplate.content}
              </pre>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => useTemplate(selectedTemplate)}>
                <Copy className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteTemplates; 