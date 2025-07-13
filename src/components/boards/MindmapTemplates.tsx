// Comprehensive Mindmap Templates Collection
export const MINDMAP_TEMPLATES = [
  {
    id: 'brainstorming',
    name: 'Brainstorming Session',
    category: 'Creative',
    description: 'Perfect for idea generation and creative thinking',
    thumbnail: '🧠',
    nodes: [
      { text: 'Central Topic', x: 400, y: 300, width: 140, height: 70, color: '#ffffff', backgroundColor: '#6366f1', borderColor: '#4f46e5', borderWidth: 3, borderStyle: 'solid', shape: 'ellipse', fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 0, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] },
      { text: 'Ideas', x: 200, y: 150, width: 100, height: 50, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Solutions', x: 600, y: 150, width: 100, height: 50, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Actions', x: 400, y: 450, width: 100, height: 50, color: '#ffffff', backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'central', toNodeId: 'ideas', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'central', toNodeId: 'solutions', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'central', toNodeId: 'actions', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  },
  {
    id: 'project-planning',
    name: 'Project Planning',
    category: 'Business',
    description: 'Organize project phases and deliverables',
    thumbnail: '📋',
    nodes: [
      { text: 'Project Name', x: 400, y: 300, width: 150, height: 70, color: '#ffffff', backgroundColor: '#8b5cf6', borderColor: '#7c3aed', borderWidth: 3, borderStyle: 'solid', shape: 'rectangle', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 0, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Planning', x: 200, y: 150, width: 100, height: 50, color: '#ffffff', backgroundColor: '#06b6d4', borderColor: '#0891b2', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'completed', attachments: [] },
      { text: 'Development', x: 600, y: 150, width: 100, height: 50, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Testing', x: 200, y: 450, width: 100, height: 50, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Deployment', x: 600, y: 450, width: 100, height: 50, color: '#ffffff', backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'low', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'project', toNodeId: 'planning', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'project', toNodeId: 'development', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'project', toNodeId: 'testing', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'project', toNodeId: 'deployment', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  },
  {
    id: 'swot-analysis',
    name: 'SWOT Analysis',
    category: 'Strategy',
    description: 'Analyze strengths, weaknesses, opportunities, and threats',
    thumbnail: '⚖️',
    nodes: [
      { text: 'SWOT Analysis', x: 400, y: 300, width: 140, height: 70, color: '#ffffff', backgroundColor: '#1f2937', borderColor: '#111827', borderWidth: 3, borderStyle: 'solid', shape: 'rectangle', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 0, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Strengths', x: 200, y: 150, width: 120, height: 60, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] },
      { text: 'Weaknesses', x: 600, y: 150, width: 120, height: 60, color: '#ffffff', backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] },
      { text: 'Opportunities', x: 200, y: 450, width: 120, height: 60, color: '#ffffff', backgroundColor: '#3b82f6', borderColor: '#2563eb', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Threats', x: 600, y: 450, width: 120, height: 60, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'swot', toNodeId: 'strengths', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'swot', toNodeId: 'weaknesses', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'swot', toNodeId: 'opportunities', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'swot', toNodeId: 'threats', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  },
  {
    id: 'learning-map',
    name: 'Learning Map',
    category: 'Education',
    description: 'Structure learning objectives and topics',
    thumbnail: '📚',
    nodes: [
      { text: 'Subject', x: 400, y: 300, width: 120, height: 60, color: '#ffffff', backgroundColor: '#8b5cf6', borderColor: '#7c3aed', borderWidth: 3, borderStyle: 'solid', shape: 'ellipse', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 0, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Basics', x: 250, y: 200, width: 80, height: 40, color: '#ffffff', backgroundColor: '#06b6d4', borderColor: '#0891b2', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'completed', attachments: [] },
      { text: 'Intermediate', x: 400, y: 150, width: 100, height: 40, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Advanced', x: 550, y: 200, width: 80, height: 40, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Practice', x: 300, y: 400, width: 80, height: 40, color: '#ffffff', backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Projects', x: 500, y: 400, width: 80, height: 40, color: '#ffffff', backgroundColor: '#6366f1', borderColor: '#4f46e5', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'subject', toNodeId: 'basics', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'subject', toNodeId: 'intermediate', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'subject', toNodeId: 'advanced', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'subject', toNodeId: 'practice', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'subject', toNodeId: 'projects', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree',
    category: 'Decision Making',
    description: 'Map out decision paths and outcomes',
    thumbnail: '🌳',
    nodes: [
      { text: 'Decision', x: 400, y: 100, width: 120, height: 60, color: '#ffffff', backgroundColor: '#1f2937', borderColor: '#111827', borderWidth: 3, borderStyle: 'solid', shape: 'diamond', fontSize: 14, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 0, expanded: true, notes: '', tags: [], priority: 'critical', status: 'idea', attachments: [] },
      { text: 'Option A', x: 250, y: 250, width: 100, height: 50, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] },
      { text: 'Option B', x: 550, y: 250, width: 100, height: 50, color: '#ffffff', backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] },
      { text: 'Outcome 1', x: 150, y: 400, width: 90, height: 40, color: '#ffffff', backgroundColor: '#06b6d4', borderColor: '#0891b2', borderWidth: 2, borderStyle: 'solid', shape: 'ellipse', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 2, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Outcome 2', x: 350, y: 400, width: 90, height: 40, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'ellipse', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 2, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Outcome 3', x: 450, y: 400, width: 90, height: 40, color: '#ffffff', backgroundColor: '#8b5cf6', borderColor: '#7c3aed', borderWidth: 2, borderStyle: 'solid', shape: 'ellipse', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 2, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Outcome 4', x: 650, y: 400, width: 90, height: 40, color: '#ffffff', backgroundColor: '#6366f1', borderColor: '#4f46e5', borderWidth: 2, borderStyle: 'solid', shape: 'ellipse', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 2, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'decision', toNodeId: 'optionA', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, label: 'Yes', labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'decision', toNodeId: 'optionB', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, label: 'No', labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'optionA', toNodeId: 'outcome1', type: 'straight', color: '#10b981', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'optionA', toNodeId: 'outcome2', type: 'straight', color: '#10b981', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'optionB', toNodeId: 'outcome3', type: 'straight', color: '#ef4444', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'optionB', toNodeId: 'outcome4', type: 'straight', color: '#ef4444', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  },
  {
    id: 'marketing-strategy',
    name: 'Marketing Strategy',
    category: 'Marketing',
    description: 'Plan marketing campaigns and channels',
    thumbnail: '📈',
    nodes: [
      { text: 'Marketing Strategy', x: 400, y: 300, width: 160, height: 70, color: '#ffffff', backgroundColor: '#ec4899', borderColor: '#db2777', borderWidth: 3, borderStyle: 'solid', shape: 'rectangle', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 0, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Target Audience', x: 200, y: 150, width: 120, height: 50, color: '#ffffff', backgroundColor: '#06b6d4', borderColor: '#0891b2', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'completed', attachments: [] },
      { text: 'Channels', x: 600, y: 150, width: 100, height: 50, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Content', x: 200, y: 450, width: 100, height: 50, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'in-progress', attachments: [] },
      { text: 'Budget', x: 600, y: 450, width: 100, height: 50, color: '#ffffff', backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] },
      { text: 'Metrics', x: 400, y: 500, width: 100, height: 50, color: '#ffffff', backgroundColor: '#8b5cf6', borderColor: '#7c3aed', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'marketing', toNodeId: 'audience', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'marketing', toNodeId: 'channels', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'marketing', toNodeId: 'content', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'marketing', toNodeId: 'budget', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'marketing', toNodeId: 'metrics', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  }
];

export const MINDMAP_CATEGORIES = [
  'Creative',
  'Business',
  'Strategy',
  'Education',
  'Decision Making',
  'Marketing',
  'Technology',
  'Personal',
  'Research',
  'Planning'
]; 