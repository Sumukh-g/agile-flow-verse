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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  AlertCircle,
  ClipboardList,
  Kanban,
  MoreHorizontal,
  Plus,
  Trash2,
  User,
  X,
  Filter
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useIssues, useCreateIssue, useUpdateIssue, useDeleteIssue, useIssueComments, useAddIssueComment } from '@/hooks/useIssues';
import type { Issue, CreateIssueDto, UpdateIssueDto, IssueStatus, IssueType, IssuePriority, IssueSeverity } from '@/lib/api/issues';
import { useProject } from '@/hooks/useProjects';
import { TriageBoard } from '@/components/issues/TriageBoard';
import { DevBoard } from '@/components/issues/DevBoard';

// New status constants
const ALL_STATUSES: IssueStatus[] = [
  'INBOX', 'NEEDS_INFO', 'TRIAGED', 'PLANNED', 'READY_FOR_DEV',
  'IN_PROGRESS', 'IN_REVIEW', 'IN_QA', 'DONE', 'WONT_DO', 'DUPLICATE', 'ON_HOLD'
];

const STATUS_LABELS: Record<IssueStatus, string> = {
  INBOX: 'Inbox',
  NEEDS_INFO: 'Needs Info',
  TRIAGED: 'Triaged',
  PLANNED: 'Planned',
  READY_FOR_DEV: 'Ready for Dev',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  IN_QA: 'In QA',
  DONE: 'Done',
  WONT_DO: "Won't Do",
  DUPLICATE: 'Duplicate',
  ON_HOLD: 'On Hold',
};

const PRIORITIES: IssuePriority[] = ['P0', 'P1', 'P2', 'P3'];
const PRIORITY_LABELS: Record<IssuePriority, string> = {
  P0: 'P0 - Critical',
  P1: 'P1 - High',
  P2: 'P2 - Medium',
  P3: 'P3 - Low',
};

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  P0: 'bg-red-100 text-red-800 border-red-300',
  P1: 'bg-orange-100 text-orange-800 border-orange-300',
  P2: 'bg-blue-100 text-blue-800 border-blue-300',
  P3: 'bg-gray-100 text-gray-800 border-gray-300',
};

const TYPES: IssueType[] = ['BUG', 'STORY', 'TASK', 'INCIDENT', 'SUPPORT'];
const TYPE_LABELS: Record<IssueType, string> = {
  BUG: 'Bug',
  STORY: 'Story',
  TASK: 'Task',
  INCIDENT: 'Incident',
  SUPPORT: 'Support',
};

const TYPE_COLORS: Record<IssueType, string> = {
  BUG: 'bg-red-100 text-red-800',
  STORY: 'bg-green-100 text-green-800',
  TASK: 'bg-blue-100 text-blue-800',
  INCIDENT: 'bg-purple-100 text-purple-800',
  SUPPORT: 'bg-yellow-100 text-yellow-800',
};

const SEVERITIES: IssueSeverity[] = ['CRITICAL', 'MAJOR', 'MINOR'];
const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  CRITICAL: 'Critical',
  MAJOR: 'Major',
  MINOR: 'Minor',
};

interface ProjectIssueTrackerProps {
  projectId?: string;
}

const ProjectIssueTracker: React.FC<ProjectIssueTrackerProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'board' | 'list'>('triage');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);

  // Fetch issues
  const { data: issuesData, isLoading, refetch } = useIssues({
    projectId,
    search: search || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    priority: filterPriority !== 'all' ? filterPriority : undefined,
    type: filterType !== 'all' ? filterType : undefined,
    sortBy,
    sortOrder,
  });

  const issues = issuesData?.items || [];
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

  // Get project for members
  const { data: project } = useProject(projectId || '');

  // Filter and sort issues client-side
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower) ||
        issue.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'updatedAt') {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
        cmp = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [issues, search, sortBy, sortOrder]);

  // Handle create/update
  const handleCreateOrEdit = useCallback((data: CreateIssueDto | UpdateIssueDto) => {
    if (isEdit && selectedIssue) {
      updateIssue.mutate({ id: selectedIssue.id, data: data as UpdateIssueDto });
    } else {
      createIssue.mutate({ ...data, projectId: projectId! } as CreateIssueDto);
    }
    setIsDialogOpen(false);
    setIsEdit(false);
    setSelectedIssue(null);
  }, [isEdit, selectedIssue, projectId, createIssue, updateIssue]);

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this issue?')) {
      deleteIssue.mutate(id);
      if (selectedIssue?.id === id) {
        setSelectedIssue(null);
      }
    }
  }, [deleteIssue, selectedIssue]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (bulkSelection.length === 0) return;
    if (confirm(`Are you sure you want to delete ${bulkSelection.length} issue(s)?`)) {
      bulkSelection.forEach(id => deleteIssue.mutate(id));
      setBulkSelection([]);
    }
  }, [bulkSelection, deleteIssue]);

  // Handle status change
  const handleStatusChange = useCallback((issueId: string, newStatus: IssueStatus) => {
    updateIssue.mutate({
      id: issueId,
      data: { status: newStatus }
    });
  }, [updateIssue]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading issues...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-2 items-center">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="triage">Triage</TabsTrigger>
              <TabsTrigger value="board">Dev Board</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => {
            setSelectedIssue(null);
            setIsEdit(false);
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Issue
          </Button>
          {bulkSelection.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions ({bulkSelection.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsContent value="triage" className="mt-0">
          <TriageBoard
            issues={filteredIssues}
            projectId={projectId}
            onCreateIssue={() => {
              setSelectedIssue(null);
              setIsEdit(false);
              setIsDialogOpen(true);
            }}
            onIssueClick={(issue) => {
              setSelectedIssue(issue);
              setIsEdit(true);
              setIsDialogOpen(true);
            }}
            onIssueUpdate={() => refetch()}
          />
        </TabsContent>

        <TabsContent value="board" className="mt-0">
          <DevBoard
            issues={filteredIssues}
            projectId={projectId}
            onCreateIssue={() => {
              setSelectedIssue(null);
              setIsEdit(false);
              setIsDialogOpen(true);
            }}
            onIssueClick={(issue) => {
              setSelectedIssue(issue);
              setIsEdit(true);
              setIsDialogOpen(true);
            }}
            onIssueUpdate={() => refetch()}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={bulkSelection.length === filteredIssues.length && filteredIssues.length > 0}
                      onChange={(e) =>
                        setBulkSelection(e.target.checked ? filteredIssues.map(i => i.id) : [])
                      }
                    />
                  </th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Priority</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Assignee</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-left">Updated</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No issues found
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map(issue => (
                    <tr key={issue.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={bulkSelection.includes(issue.id)}
                          onChange={(e) =>
                            setBulkSelection(
                              e.target.checked
                                ? [...bulkSelection, issue.id]
                                : bulkSelection.filter(id => id !== issue.id)
                            )
                          }
                        />
                      </td>
                      <td
                        className="p-3 cursor-pointer font-medium"
                        onClick={() => {
                          setSelectedIssue(issue);
                          setIsEdit(true);
                          setIsDialogOpen(true);
                        }}
                      >
                        {issue.title}
                      </td>
                      <td className="p-3">
                        <Badge className={TYPE_COLORS[issue.type]}>
                          {TYPE_LABELS[issue.type]}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`border ${PRIORITY_COLORS[issue.priority]}`}>
                          {issue.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{STATUS_LABELS[issue.status]}</Badge>
                      </td>
                      <td className="p-3">
                        {issue.assignee ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs">{issue.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {issue.dueDate ? format(new Date(issue.dueDate), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {format(new Date(issue.updatedAt), 'MMM d, yyyy')}
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedIssue(issue);
                                setIsEdit(true);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(issue.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ALL_STATUSES.filter(s => s !== issue.status).map(status => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(issue.id, status)}
                              >
                                Move to {STATUS_LABELS[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Issue Dialog */}
      <IssueDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        issue={selectedIssue}
        isEdit={isEdit}
        projectId={projectId}
        onSubmit={handleCreateOrEdit}
        onCancel={() => {
          setIsDialogOpen(false);
          setIsEdit(false);
          setSelectedIssue(null);
        }}
      />
    </div>
  );
};

// Issue Dialog Component
interface IssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue?: Issue | null;
  isEdit: boolean;
  projectId?: string;
  onSubmit: (data: CreateIssueDto | UpdateIssueDto) => void;
  onCancel: () => void;
}

const IssueDialog: React.FC<IssueDialogProps> = ({
  open,
  onOpenChange,
  issue,
  isEdit,
  projectId,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IssueStatus>('INBOX');
  const [priority, setPriority] = useState<IssuePriority>('P2');
  const [type, setType] = useState<IssueType>('TASK');
  const [severity, setSeverity] = useState<IssueSeverity | ''>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [componentId, setComponentId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: project } = useProject(projectId || '');
  const { data: comments } = useIssueComments(issue?.id || '');
  const addComment = useAddIssueComment();
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
      setStatus(issue.status);
      setPriority(issue.priority);
      setType(issue.type);
      setSeverity(issue.severity || '');
      setAssigneeId(issue.assigneeId || '');
      setComponentId(issue.componentId || '');
      setTags(issue.tags || []);
      setDueDate(issue.dueDate ? new Date(issue.dueDate).toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('INBOX');
      setPriority('P2');
      setType('TASK');
      setSeverity('');
      setAssigneeId('');
      setComponentId('');
      setTags([]);
      setDueDate('');
    }
  }, [issue, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      title,
      description,
      status,
      priority,
      type,
      assigneeId: assigneeId || undefined,
      componentId: componentId || undefined,
      tags,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    };
    if (severity) {
      data.severity = severity;
    }
    onSubmit(data);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddComment = () => {
    if (commentText.trim() && issue) {
      addComment.mutate({ issueId: issue.id, content: commentText.trim() });
      setCommentText('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Issue' : 'Create Issue'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Issue title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Issue description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as IssueType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'BUG' && (
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={severity || undefined} onValueChange={(v) => setSeverity(v as IssueSeverity)}>
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(s => (
                      <SelectItem key={s} value={s}>{SEVERITY_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={assigneeId || 'unassigned'} onValueChange={(value) => setAssigneeId(value === 'unassigned' ? '' : value)}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {project?.members?.map(member => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user?.name || member.user?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag"
              />
              <Button type="button" onClick={handleAddTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {isEdit && issue && (
            <div className="border-t pt-4">
              <Label>Comments</Label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {comments?.map(comment => (
                  <div key={comment.id} className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground mb-1">
                      {comment.user?.name || 'Unknown'} • {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                    <div className="text-sm">{comment.content}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                />
                <Button type="button" onClick={handleAddComment}>Add Comment</Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectIssueTracker;
