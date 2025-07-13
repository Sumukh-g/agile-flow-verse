import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
    AlertCircle,
    Award,
    BarChart2,
    Bot,
    Brain,
    ClipboardList,
    Kanban,
    Lock,
    MoreHorizontal,
    Plus,
    Shield,
    Sparkle,
    Timer,
    Trophy,
    User,
    UserCheck
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// --- Types ---
interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  severity: string;
  assignee: string;
  reporter: string;
  tags: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  comments: Comment[];
  activity: Activity[];
  archived: boolean;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface Activity {
  id: string;
  type: string;
  user: string;
  message: string;
  createdAt: string;
}

const MOCK_USERS = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi'
];
const MOCK_TAGS = ['bug', 'feature', 'urgent', 'frontend', 'backend', 'api', 'ui', 'performance'];
const MOCK_STATUSES = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done', 'Closed'];
const MOCK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const MOCK_TYPES = ['Bug', 'Feature', 'Task', 'Improvement'];
const MOCK_SEVERITIES = ['Minor', 'Major', 'Critical', 'Blocker'];

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateMockIssues(count: number): Issue[] {
  return Array.from({ length: count }).map((_, i) => {
    const status = MOCK_STATUSES[i % MOCK_STATUSES.length];
    const priority = randomFrom(MOCK_PRIORITIES);
    const type = randomFrom(MOCK_TYPES);
    const severity = randomFrom(MOCK_SEVERITIES);
    const assignee = randomFrom(MOCK_USERS);
    const reporter = randomFrom(MOCK_USERS);
    const tags = [randomFrom(MOCK_TAGS), randomFrom(MOCK_TAGS)].filter((v, i, a) => a.indexOf(v) === i);
    const now = new Date();
    return {
      id: `ISSUE-${i + 1}`,
      title: `${type} #${i + 1}`,
      description: `This is a ${type.toLowerCase()} issue with ${priority} priority and ${severity} severity.`,
      status,
      priority,
      type,
      severity,
      assignee,
      reporter,
      tags,
      dueDate: format(new Date(now.getTime() + (i + 1) * 86400000), 'yyyy-MM-dd'),
      createdAt: format(now, 'yyyy-MM-dd HH:mm'),
      updatedAt: format(now, 'yyyy-MM-dd HH:mm'),
      attachments: [],
      comments: [],
      activity: [],
      archived: false
    };
  });
}

const ProjectIssueTracker = ({ projectId }: { projectId?: string }) => {
  // --- State ---
  const [issues, setIssues] = useState<Issue[]>(generateMockIssues(16));
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showAiSuggest, setShowAiSuggest] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [customFields, setCustomFields] = useState<{ name: string, type: string }[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [myIssuesOnly, setMyIssuesOnly] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [privateIssue, setPrivateIssue] = useState(false);

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

  // AI Suggestion (mocked)
  const handleAiSuggest = () => {
    setShowAiSuggest(true);
    setTimeout(() => {
      setAiSuggestion('Consider breaking this issue into smaller tasks and assigning to the most available team member.');
    }, 1200);
  };

  // Duplicate Detection (mocked)
  const handleDuplicateCheck = (title: string) => {
    setShowDuplicate(true);
    setTimeout(() => {
      toast.info('No duplicates found (mocked)');
      setShowDuplicate(false);
    }, 1000);
  };

  // Analytics (mocked)
  const analyticsData = useMemo(() => ({
    open: issues.filter(i => i.status !== 'Closed' && i.status !== 'Done').length,
    closed: issues.filter(i => i.status === 'Closed' || i.status === 'Done').length,
    byType: MOCK_TYPES.map(type => ({ type, count: issues.filter(i => i.type === type).length })),
    byPriority: MOCK_PRIORITIES.map(priority => ({ priority, count: issues.filter(i => i.priority === priority).length })),
  }), [issues]);

  // Gamification (mocked)
  const handleCloseIssue = (id: string) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'Closed' } : i));
    setPoints(p => p + 10);
    if ((points + 10) % 50 === 0) setBadges(b => [...b, 'Milestone']);
    toast.success('Issue closed! +10 points');
  };

  // Custom Fields
  const handleAddCustomField = (name: string, type: string) => {
    setCustomFields(prev => [...prev, { name, type }]);
    toast.success('Custom field added');
  };

  // --- Filtering, Sorting, Search ---
  let filteredIssues = issues.filter(issue => {
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
    if (filterAssignee !== 'all' && issue.assignee !== filterAssignee) return false;
    if (filterPriority !== 'all' && issue.priority !== filterPriority) return false;
    if (search && !(
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.description.toLowerCase().includes(search.toLowerCase()) ||
      issue.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    )) return false;
    return true;
  });
  filteredIssues = filteredIssues.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
    else if (sortBy === 'updatedAt') cmp = a.updatedAt.localeCompare(b.updatedAt);
    else if (sortBy === 'priority') cmp = MOCK_PRIORITIES.indexOf(a.priority) - MOCK_PRIORITIES.indexOf(b.priority);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // --- CRUD ---
  const handleCreateOrEdit = (issue: Partial<Issue>) => {
    if (isEdit && selectedIssue) {
      setIssues(prev => prev.map(i => i.id === selectedIssue.id ? { ...i, ...issue, updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : i));
      toast.success('Issue updated');
    } else {
      const now = format(new Date(), 'yyyy-MM-dd HH:mm');
      setIssues(prev => [{
        ...issue,
        id: `ISSUE-${prev.length + 1}`,
        createdAt: now,
        updatedAt: now,
        status: issue.status || 'Backlog',
        priority: issue.priority || 'Medium',
        type: issue.type || 'Task',
        severity: issue.severity || 'Minor',
        assignee: issue.assignee || MOCK_USERS[0],
        reporter: issue.reporter || MOCK_USERS[0],
        tags: issue.tags || [],
        dueDate: issue.dueDate || format(new Date(), 'yyyy-MM-dd'),
        attachments: [],
        comments: [],
        activity: [],
        archived: false
      } as Issue, ...prev]);
      toast.success('Issue created');
    }
    setIsDialogOpen(false);
    setIsEdit(false);
    setSelectedIssue(null);
  };

  const handleDelete = (id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id));
    toast.success('Issue deleted');
    setSelectedIssue(null);
  };

  const handleBulkDelete = () => {
    setIssues(prev => prev.filter(i => !bulkSelection.includes(i.id)));
    setBulkSelection([]);
    toast.success('Selected issues deleted');
  };

  const handleBulkStatus = (status: string) => {
    setIssues(prev => prev.map(i => bulkSelection.includes(i.id) ? { ...i, status } : i));
    setBulkSelection([]);
    toast.success('Status updated for selected issues');
  };

  // --- Kanban Drag-and-Drop (mocked) ---
  const handleMoveIssue = (id: string, newStatus: string) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus, updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : i));
    toast.success('Issue moved');
  };

  // --- UI ---
  return (
    <div className={focusMode ? 'bg-blue-50 p-4 rounded shadow-lg' : ''}>
      <div className="flex flex-wrap gap-2 mb-2">
        <Button variant={focusMode ? 'default' : 'outline'} onClick={() => setFocusMode(f => !f)}><Sparkle className="h-4 w-4 mr-1" />Focus Mode</Button>
        <Button variant={pomodoroActive ? 'default' : 'outline'} onClick={() => { setPomodoroActive(a => !a); setPomodoroTime(25*60); }}><Timer className="h-4 w-4 mr-1" />Pomodoro</Button>
        <Button variant="outline" onClick={handleAiSuggest}><Bot className="h-4 w-4 mr-1" />AI Suggest</Button>
        <Button variant="outline" onClick={() => setShowAnalytics(a => !a)}><BarChart2 className="h-4 w-4 mr-1" />Analytics</Button>
        <Button variant="outline" onClick={() => setShowTemplates(t => !t)}><Brain className="h-4 w-4 mr-1" />Templates</Button>
        <Button variant="outline" onClick={() => setShowGamification(g => !g)}><Award className="h-4 w-4 mr-1" />Gamification</Button>
        <Button variant="outline" onClick={() => setShowPermissions(p => !p)}><Shield className="h-4 w-4 mr-1" />Permissions</Button>
        <Button variant={myIssuesOnly ? 'default' : 'outline'} onClick={() => setMyIssuesOnly(m => !m)}><UserCheck className="h-4 w-4 mr-1" />My Issues</Button>
      </div>
      {focusMode && <div className="p-2 bg-blue-100 rounded text-center font-bold">Focus Mode: Distraction-free issue tracking</div>}
      {pomodoroActive && <div className="p-2 bg-red-100 rounded text-center font-bold">Pomodoro: {Math.floor(pomodoroTime/60)}:{String(pomodoroTime%60).padStart(2,'0')}</div>}
      {showAiSuggest && <div className="p-2 bg-gradient-to-r from-yellow-200 via-pink-100 to-blue-100 rounded text-center font-bold animate-pulse">AI Suggestion: {aiSuggestion}</div>}
      {showAnalytics && (
        <div className="p-4 bg-white rounded shadow border mb-4">
          <h4 className="font-bold mb-2">Analytics</h4>
          <div className="flex gap-4">
            <div>Open: <span className="font-bold text-blue-600">{analyticsData.open}</span></div>
            <div>Closed: <span className="font-bold text-green-600">{analyticsData.closed}</span></div>
            <div>By Type: {analyticsData.byType.map(t => <span key={t.type} className="ml-2">{t.type}: <b>{t.count}</b></span>)}</div>
            <div>By Priority: {analyticsData.byPriority.map(p => <span key={p.priority} className="ml-2">{p.priority}: <b>{p.count}</b></span>)}</div>
          </div>
        </div>
      )}
      {showTemplates && (
        <div className="p-4 bg-white rounded shadow border mb-4">
          <h4 className="font-bold mb-2">Issue Templates</h4>
          <Button onClick={() => toast.info('Bug template applied (mock)')}>Bug</Button>
          <Button onClick={() => toast.info('Feature template applied (mock)')}>Feature</Button>
          <Button onClick={() => toast.info('Task template applied (mock)')}>Task</Button>
        </div>
      )}
      {showGamification && (
        <div className="p-4 bg-white rounded shadow border mb-4">
          <h4 className="font-bold mb-2">Gamification</h4>
          <div>Points: <span className="font-bold text-orange-600">{points}</span></div>
          <div>Badges: {badges.map((b, i) => <Badge key={i} variant="outline" className="ml-1"><Trophy className="h-3 w-3 mr-1 inline" />{b}</Badge>)}</div>
        </div>
      )}
      {showPermissions && (
        <div className="p-4 bg-white rounded shadow border mb-4">
          <h4 className="font-bold mb-2">Permissions</h4>
          <div><Lock className="h-4 w-4 inline mr-1" /> Private Issue: <input type="checkbox" checked={privateIssue} onChange={e => setPrivateIssue(e.target.checked)} /></div>
          <div><Shield className="h-4 w-4 inline mr-1" /> Only project admins can close issues (mocked)</div>
        </div>
      )}
      {/* Custom Fields UI */}
      <div className="my-4">
        <h4 className="font-semibold mb-2">Custom Fields</h4>
        <div className="flex gap-2 mb-2">
          <Input placeholder="Field name" id="cf-name" className="w-32" />
          <Select defaultValue="text">
            <SelectTrigger className="w-24"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="dropdown">Dropdown</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {
            const name = (document.getElementById('cf-name') as HTMLInputElement)?.value;
            const type = (document.getElementById('cf-type') as HTMLSelectElement)?.value;
            if (name && type) handleAddCustomField(name, type);
          }}>Add Field</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {customFields.map((f, i) => <Badge key={i} variant="outline">{f.name} ({f.type})</Badge>)}
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="kanban"><Kanban className="h-4 w-4" /> Kanban</TabsTrigger>
                <TabsTrigger value="list"><ClipboardList className="h-4 w-4" /> List</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => { setIsDialogOpen(true); setIsEdit(false); setSelectedIssue(null); }}>
              <Plus className="h-4 w-4 mr-1" /> New Issue
            </Button>
            {bulkSelection.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Bulk Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleBulkDelete}>Delete Selected</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {MOCK_STATUSES.map(status => (
                    <DropdownMenuItem key={status} onClick={() => handleBulkStatus(status)}>
                      Move to {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Input placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {MOCK_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {MOCK_USERS.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {MOCK_PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Sort By" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={v => setSortOrder(v as any)}>
              <SelectTrigger className="w-24"><SelectValue placeholder="Order" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[900px]">
              {MOCK_STATUSES.map(status => (
                <div key={status} className="flex-1 min-w-[250px] bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{status}</span>
                    <Badge variant="outline">{issues.filter(i => i.status === status).length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[60px]">
                    {filteredIssues.filter(i => i.status === status).map(issue => (
                      <Card key={issue.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedIssue(issue); setIsDialogOpen(true); setIsEdit(true); }}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{issue.type}</Badge>
                            <Badge variant="outline">{issue.priority}</Badge>
                            <Badge variant="outline">{issue.severity}</Badge>
                          </div>
                          <div className="font-medium text-sm line-clamp-1">{issue.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{issue.description}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <User className="h-3 w-3" />
                            <span className="text-xs">{issue.assignee}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{issue.updatedAt}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List/Table View */}
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2"><input type="checkbox" checked={bulkSelection.length === filteredIssues.length && filteredIssues.length > 0} onChange={e => setBulkSelection(e.target.checked ? filteredIssues.map(i => i.id) : [])} /></th>
                  <th className="p-2">ID</th>
                  <th className="p-2">Title</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Severity</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Assignee</th>
                  <th className="p-2">Due</th>
                  <th className="p-2">Updated</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => (
                  <tr key={issue.id} className="border-b hover:bg-muted/30">
                    <td className="p-2"><input type="checkbox" checked={bulkSelection.includes(issue.id)} onChange={e => setBulkSelection(e.target.checked ? [...bulkSelection, issue.id] : bulkSelection.filter(id => id !== issue.id))} /></td>
                    <td className="p-2 font-mono text-xs">{issue.id}</td>
                    <td className="p-2 cursor-pointer" onClick={() => { setSelectedIssue(issue); setIsDialogOpen(true); setIsEdit(true); }}>{issue.title}</td>
                    <td className="p-2">{issue.type}</td>
                    <td className="p-2">{issue.priority}</td>
                    <td className="p-2">{issue.severity}</td>
                    <td className="p-2">{issue.status}</td>
                    <td className="p-2">{issue.assignee}</td>
                    <td className="p-2">{issue.dueDate}</td>
                    <td className="p-2">{issue.updatedAt}</td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => { setSelectedIssue(issue); setIsDialogOpen(true); setIsEdit(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(issue.id)}>Delete</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {MOCK_STATUSES.filter(s => s !== issue.status).map(status => (
                            <DropdownMenuItem key={status} onClick={() => handleMoveIssue(issue.id, status)}>
                              Move to {status}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Issue Dialog (Create/Edit/View) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit Issue' : 'Create Issue'}</DialogTitle>
            </DialogHeader>
            <IssueForm
              issue={isEdit ? selectedIssue : undefined}
              onSubmit={handleCreateOrEdit}
              onCancel={() => { setIsDialogOpen(false); setIsEdit(false); setSelectedIssue(null); }}
            />
            {isEdit && selectedIssue && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Comments</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedIssue.comments.length === 0 && <div className="text-muted-foreground text-sm">No comments yet.</div>}
                  {selectedIssue.comments.map(comment => (
                    <div key={comment.id} className="bg-muted/50 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3" />
                        <span className="font-semibold text-xs">{comment.author}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{comment.createdAt}</span>
                      </div>
                      <div className="text-sm">{comment.content}</div>
                    </div>
                  ))}
                </div>
                <CommentForm
                  onAdd={content => {
                    setIssues(prev => prev.map(i => i.id === selectedIssue.id ? {
                      ...i,
                      comments: [...i.comments, {
                        id: `CMT-${i.comments.length + 1}`,
                        author: MOCK_USERS[0],
                        content,
                        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm')
                      }],
                      activity: [...i.activity, {
                        id: `ACT-${i.activity.length + 1}`,
                        type: 'comment',
                        user: MOCK_USERS[0],
                        message: `Commented: ${content.substring(0, 30)}`,
                        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm')
                      }]
                    } : i));
                    toast.success('Comment added');
                  }}
                />
                <h4 className="font-semibold mt-6 mb-2">Activity</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedIssue.activity.length === 0 && <div className="text-muted-foreground text-sm">No activity yet.</div>}
                  {selectedIssue.activity.map(act => (
                    <div key={act.id} className="bg-muted/50 rounded p-2 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{act.user}</span>
                      <span className="text-xs">{act.message}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{act.createdAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// --- Issue Form ---
function IssueForm({ issue, onSubmit, onCancel }: { issue?: Issue, onSubmit: (data: Partial<Issue>) => void, onCancel: () => void }) {
  const [title, setTitle] = useState(issue?.title || '');
  const [description, setDescription] = useState(issue?.description || '');
  const [status, setStatus] = useState(issue?.status || 'Backlog');
  const [priority, setPriority] = useState(issue?.priority || 'Medium');
  const [type, setType] = useState(issue?.type || 'Task');
  const [severity, setSeverity] = useState(issue?.severity || 'Minor');
  const [assignee, setAssignee] = useState(issue?.assignee || MOCK_USERS[0]);
  const [reporter, setReporter] = useState(issue?.reporter || MOCK_USERS[0]);
  const [tags, setTags] = useState<string[]>(issue?.tags || []);
  const [dueDate, setDueDate] = useState(issue?.dueDate || format(new Date(), 'yyyy-MM-dd'));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ title, description, status, priority, type, severity, assignee, reporter, tags, dueDate }); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Severity</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Assignee</Label>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_USERS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Reporter</Label>
          <Select value={reporter} onValueChange={setReporter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOCK_USERS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
      </div>
      <div className="space-y-2">
        <Label>Tags</Label>
        <Input
          value={tags.join(', ')}
          onChange={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="Comma separated tags"
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{issue ? 'Save Changes' : 'Create Issue'}</Button>
      </DialogFooter>
    </form>
  );
}

// --- Comment Form ---
function CommentForm({ onAdd }: { onAdd: (content: string) => void }) {
  const [content, setContent] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); if (content.trim()) { onAdd(content); setContent(''); } }} className="flex gap-2 mt-2">
      <Textarea value={content} onChange={e => setContent(e.target.value)} rows={2} placeholder="Add a comment..." className="flex-1" />
      <Button type="submit">Add</Button>
    </form>
  );
}

export default ProjectIssueTracker; 