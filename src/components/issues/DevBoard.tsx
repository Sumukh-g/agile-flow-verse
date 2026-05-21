import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, User, CheckCircle2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { Issue, IssueStatus, IssuePriority, IssueType } from '@/lib/api/issues';
import { useUpdateIssueStatus, useUpdateIssue } from '@/hooks/useIssues';

const DEV_COLUMNS: { status: IssueStatus; label: string; color: string }[] = [
  { status: 'READY_FOR_DEV', label: 'Ready for Dev', color: 'bg-blue-100' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100' },
  { status: 'IN_REVIEW', label: 'In Review', color: 'bg-purple-100' },
  { status: 'IN_QA', label: 'In QA', color: 'bg-indigo-100' },
  { status: 'DONE', label: 'Done', color: 'bg-green-100' },
];

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
};

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  P0: 'bg-red-100 text-red-800 border-red-300',
  P1: 'bg-orange-100 text-orange-800 border-orange-300',
  P2: 'bg-blue-100 text-blue-800 border-blue-300',
  P3: 'bg-gray-100 text-gray-800 border-gray-300',
};

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

interface DevBoardProps {
  issues: Issue[];
  projectId?: string;
  onCreateIssue?: () => void;
  onIssueClick?: (issue: Issue) => void;
  onIssueUpdate?: (issue: Issue) => void;
}

export const DevBoard: React.FC<DevBoardProps> = ({
  issues,
  projectId,
  onCreateIssue,
  onIssueClick,
  onIssueUpdate,
}) => {
  const updateStatus = useUpdateIssueStatus();
  const updateIssue = useUpdateIssue();
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);

  // Group issues by status
  const issuesByStatus = useMemo(() => {
    const grouped: Record<IssueStatus, Issue[]> = {
      INBOX: [],
      NEEDS_INFO: [],
      TRIAGED: [],
      PLANNED: [],
      READY_FOR_DEV: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      IN_QA: [],
      DONE: [],
      WONT_DO: [],
      DUPLICATE: [],
      ON_HOLD: [],
    };

    issues.forEach(issue => {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      }
    });

    return grouped;
  }, [issues]);

  const handleDragStart = (issue: Issue) => {
    setDraggedIssue(issue);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: IssueStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('opacity-50');

    if (!draggedIssue || draggedIssue.status === targetStatus) {
      setDraggedIssue(null);
      return;
    }

    try {
      await updateStatus.mutateAsync({
        id: draggedIssue.id,
        status: targetStatus,
      });
      onIssueUpdate?.(draggedIssue);
    } catch (error) {
      console.error('Failed to update issue status:', error);
    }

    setDraggedIssue(null);
  };

  const handleQuickUpdate = async (issue: Issue, field: 'priority' | 'assigneeId', value: string) => {
    try {
      await updateIssue.mutateAsync({
        id: issue.id,
        data: { [field]: value as any },
      });
      onIssueUpdate?.(issue);
    } catch (error) {
      console.error('Failed to update issue:', error);
    }
  };

  const IssueCard: React.FC<{ issue: Issue }> = ({ issue }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow mb-2"
      draggable
      onDragStart={() => handleDragStart(issue)}
      onClick={() => onIssueClick?.(issue)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{issue.title}</h4>
            {issue.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{issue.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleQuickUpdate(issue, 'priority', 'P0')}>
                Set Priority P0
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickUpdate(issue, 'priority', 'P1')}>
                Set Priority P1
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${TYPE_COLORS[issue.type]}`}>
            {TYPE_LABELS[issue.type]}
          </Badge>
          <Badge className={`text-xs border ${PRIORITY_COLORS[issue.priority]}`}>
            {PRIORITY_LABELS[issue.priority]}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {issue.assignee ? (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate">{issue.assignee.name}</span>
            </div>
          ) : (
            <span>Unassigned</span>
          )}
          {issue._count && issue._count.comments > 0 && (
            <span>{issue._count.comments} comments</span>
          )}
        </div>

        {issue.status === 'DONE' && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dev Board</h2>
          <p className="text-sm text-muted-foreground">Track development progress</p>
        </div>
        {onCreateIssue && (
          <Button onClick={onCreateIssue}>
            <Plus className="h-4 w-4 mr-2" />
            New Issue
          </Button>
        )}
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1400px]">
          {DEV_COLUMNS.map(column => {
            const columnIssues = issuesByStatus[column.status] || [];
            return (
              <div
                key={column.status}
                className={`flex-1 min-w-[260px] ${column.color} rounded-lg p-4`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <Badge variant="outline">{columnIssues.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {columnIssues.map(issue => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                  {columnIssues.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No issues
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

