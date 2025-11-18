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
  ClipboardList,
  Kanban,
  MoreHorizontal,
  Plus,
  Trash2,
  User,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useIssues, useCreateIssue, useUpdateIssue, useDeleteIssue, useIssueComments, useAddIssueComment } from '@/hooks/useIssues';
import type { Issue, CreateIssueDto, UpdateIssueDto } from '@/lib/api/issues';
import { useProject } from '@/hooks/useProjects';

const STATUSES = ['backlog', 'todo', 'in-progress', 'review', 'done', 'closed'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const TYPES = ['bug', 'feature', 'task', 'improvement'] as const;
const SEVERITIES = ['minor', 'major', 'critical', 'blocker'] as const;

const STATUS_LABELS: Record<string, string> = {
  'backlog': 'Backlog',
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'Review',
  'done': 'Done',
  'closed': 'Closed'
};

const PRIORITY_COLORS: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800',
  'critical': 'bg-red-100 text-red-800'
};

const TYPE_COLORS: Record<string, string> = {
  'bug': 'bg-red-100 text-red-800',
  'feature': 'bg-green-100 text-green-800',
  'task': 'bg-blue-100 text-blue-800',
  'improvement': 'bg-purple-100 text-purple-800'
};

interface ProjectIssueTrackerProps {
  projectId?: string;
}

const ProjectIssueTracker: React.FC<ProjectIssueTrackerProps> = ({ projectId }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
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
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);

  // Fetch issues
  const { data: issuesData, isLoading } = useIssues({
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

  // Filter and sort issues client-side for additional filtering
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];
    
    // Additional client-side filtering if needed
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower) ||
        issue.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'updatedAt') {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        cmp = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
              (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [issues, search, sortBy, sortOrder]);

  // Group issues by status for Kanban
  const issuesByStatus = useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    STATUSES.forEach(status => {
      grouped[status] = filteredIssues.filter(i => i.status === status);
    });
    return grouped;
  }, [filteredIssues]);

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

  // Handle status change (for Kanban drag-and-drop)
  const handleStatusChange = useCallback((issueId: string, newStatus: string) => {
    updateIssue.mutate({
      id: issueId,
      data: { status: newStatus }
    });
  }, [updateIssue]);

  // Drag and drop handlers
  const handleDragStart = useCallback((issue: Issue) => {
    setDraggedIssue(issue);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedIssue && draggedIssue.status !== targetStatus) {
      handleStatusChange(draggedIssue.id, targetStatus);
    }
    setDraggedIssue(null);
  }, [draggedIssue, handleStatusChange]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading issues...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-2 items-center">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
            <TabsList>
              <TabsTrigger value="kanban">
                <Kanban className="h-4 w-4 mr-2" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                <ClipboardList className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
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
                <DropdownMenuSeparator />
                {STATUSES.map(status => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => {
                      bulkSelection.forEach(id => {
                        updateIssue.mutate({ id, data: { status } });
                      });
                      setBulkSelection([]);
                    }}
                  >
                    Move to {STATUS_LABELS[status]}
                  </DropdownMenuItem>
                ))}
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
              {STATUSES.map(status => (
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
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
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
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="updatedAt">Updated</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
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
            {STATUSES.map(status => (
              <div
                key={status}
                className="flex-1 min-w-[250px] bg-muted/50 rounded-lg p-3"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">{STATUS_LABELS[status]}</span>
                  <Badge variant="outline">{issuesByStatus[status]?.length || 0}</Badge>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {issuesByStatus[status]?.map(issue => (
                    <Card
                      key={issue.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={() => handleDragStart(issue)}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setIsEdit(true);
                        setIsDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={TYPE_COLORS[issue.type] || 'bg-gray-100 text-gray-800'}>
                            {issue.type}
                          </Badge>
                          <Badge className={PRIORITY_COLORS[issue.priority] || 'bg-gray-100 text-gray-800'}>
                            {issue.priority}
                          </Badge>
                          {issue.severity && (
                            <Badge variant="outline">{issue.severity}</Badge>
                          )}
                        </div>
                        <div className="font-medium text-sm line-clamp-2">{issue.title}</div>
                        {issue.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {issue.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {issue.assignee && (
                            <>
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{issue.assignee.name || 'Unassigned'}</span>
                            </>
                          )}
                          {issue.dueDate && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(issue.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                        {issue.tags && issue.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {issue.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {issue.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{issue.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
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
                      <Badge className={TYPE_COLORS[issue.type] || 'bg-gray-100 text-gray-800'}>
                        {issue.type}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={PRIORITY_COLORS[issue.priority] || 'bg-gray-100 text-gray-800'}>
                        {issue.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{STATUS_LABELS[issue.status] || issue.status}</Badge>
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
                          {STATUSES.filter(s => s !== issue.status).map(status => (
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
      )}

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
  const [title, setTitle] = useState(issue?.title || '');
  const [description, setDescription] = useState(issue?.description || '');
  const [status, setStatus] = useState(issue?.status || 'backlog');
  const [priority, setPriority] = useState(issue?.priority || 'medium');
  const [type, setType] = useState(issue?.type || 'task');
  const [severity, setSeverity] = useState(issue?.severity || '');
  const [assigneeId, setAssigneeId] = useState(issue?.assigneeId || '');
  const [tags, setTags] = useState<string[]>(issue?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [dueDate, setDueDate] = useState(
    issue?.dueDate ? format(new Date(issue.dueDate), 'yyyy-MM-dd') : ''
  );

  // Reset form when issue changes
  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
      setStatus(issue.status);
      setPriority(issue.priority);
      setType(issue.type);
      setSeverity(issue.severity || '');
      setAssigneeId(issue.assigneeId || '__unassigned__');
      setTags(issue.tags || []);
      setDueDate(issue.dueDate ? format(new Date(issue.dueDate), 'yyyy-MM-dd') : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('backlog');
      setPriority('medium');
      setType('task');
      setSeverity('');
      setAssigneeId('__unassigned__');
      setTags([]);
      setDueDate('');
    }
  }, [issue]);

  // Get project members for assignee dropdown
  const { data: project } = useProject(projectId || '');
  const projectMembers = project?.members || [];

  // Get comments
  const { data: comments = [] } = useIssueComments(issue?.id || '');
  const addComment = useAddIssueComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      type,
      severity: severity || undefined,
      assigneeId: assigneeId === '__unassigned__' || assigneeId === '' ? undefined : assigneeId,
      tags,
      dueDate: dueDate || undefined,
    });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddComment = (content: string) => {
    if (issue?.id && content.trim()) {
      addComment.mutate({ issueId: issue.id, content: content.trim() });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Issue' : 'Create Issue'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Issue title"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === 'bug' && (
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(s => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId || '__unassigned__'} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {projectMembers.map((member: any) => (
                    <SelectItem key={member.userId || member.id} value={member.userId || member.id}>
                      {member.user?.name || member.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Issue description"
            />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Issue'}</Button>
          </DialogFooter>
        </form>

        {/* Comments Section */}
        {isEdit && issue && (
          <div className="mt-6 border-t pt-6">
            <h4 className="font-semibold mb-3">Comments</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
              {comments.length === 0 ? (
                <div className="text-muted-foreground text-sm">No comments yet.</div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="bg-muted/50 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3" />
                      <span className="font-semibold text-xs">
                        {comment.user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="text-sm">{comment.content}</div>
                  </div>
                ))
              )}
            </div>
            <CommentForm onAdd={handleAddComment} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Comment Form Component
interface CommentFormProps {
  onAdd: (content: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ onAdd }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAdd(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="Add a comment..."
        className="flex-1"
      />
      <Button type="submit">Add</Button>
    </form>
  );
};

export default ProjectIssueTracker;
