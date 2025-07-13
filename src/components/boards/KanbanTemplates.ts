// Kanban board and card templates for various workflows

export const BOARD_TEMPLATES = [
  {
    id: 'agile-sprint',
    name: 'Agile Sprint',
    columns: [
      { id: 'todo', name: 'To Do', color: '#6366f1' },
      { id: 'inprogress', name: 'In Progress', color: '#f59e42' },
      { id: 'review', name: 'Review', color: '#38bdf8' },
      { id: 'done', name: 'Done', color: '#22c55e' }
    ],
    cards: [
      { title: 'User Story 1', column: 'todo', template: 'feature' },
      { title: 'Bug Fix 1', column: 'inprogress', template: 'bug' },
      { title: 'Code Review', column: 'review', template: 'task' },
      { title: 'Deploy to Prod', column: 'done', template: 'task' }
    ]
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    columns: [
      { id: 'reported', name: 'Reported', color: '#f43f5e' },
      { id: 'triaged', name: 'Triaged', color: '#f59e42' },
      { id: 'inprogress', name: 'In Progress', color: '#38bdf8' },
      { id: 'fixed', name: 'Fixed', color: '#22c55e' }
    ],
    cards: [
      { title: 'UI Bug', column: 'reported', template: 'bug' },
      { title: 'API Error', column: 'triaged', template: 'bug' },
      { title: 'Performance Issue', column: 'inprogress', template: 'bug' },
      { title: 'Crash on Save', column: 'fixed', template: 'bug' }
    ]
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    columns: [
      { id: 'ideas', name: 'Ideas', color: '#a78bfa' },
      { id: 'writing', name: 'Writing', color: '#f59e42' },
      { id: 'editing', name: 'Editing', color: '#38bdf8' },
      { id: 'published', name: 'Published', color: '#22c55e' }
    ],
    cards: [
      { title: 'Blog Post 1', column: 'ideas', template: 'content' },
      { title: 'Newsletter', column: 'writing', template: 'content' },
      { title: 'Social Media', column: 'editing', template: 'content' },
      { title: 'Case Study', column: 'published', template: 'content' }
    ]
  }
];

export const CARD_TEMPLATES = {
  feature: {
    status: 'To Do',
    priority: 'Medium',
    duration: 2,
    dueDate: '',
    notes: '',
    assignee: '',
    labels: ['Feature'],
    subtasks: [],
    checklists: [],
    attachments: [],
    comments: [],
    cover: '',
    dependencies: [],
    recurring: false,
    watchers: [],
    votes: 0
  },
  bug: {
    status: 'Reported',
    priority: 'High',
    duration: 1,
    dueDate: '',
    notes: '',
    assignee: '',
    labels: ['Bug'],
    subtasks: [],
    checklists: [],
    attachments: [],
    comments: [],
    cover: '',
    dependencies: [],
    recurring: false,
    watchers: [],
    votes: 0
  },
  task: {
    status: 'To Do',
    priority: 'Low',
    duration: 1,
    dueDate: '',
    notes: '',
    assignee: '',
    labels: ['Task'],
    subtasks: [],
    checklists: [],
    attachments: [],
    comments: [],
    cover: '',
    dependencies: [],
    recurring: false,
    watchers: [],
    votes: 0
  },
  content: {
    status: 'Ideas',
    priority: 'Medium',
    duration: 1,
    dueDate: '',
    notes: '',
    assignee: '',
    labels: ['Content'],
    subtasks: [],
    checklists: [],
    attachments: [],
    comments: [],
    cover: '',
    dependencies: [],
    recurring: false,
    watchers: [],
    votes: 0
  }
}; 