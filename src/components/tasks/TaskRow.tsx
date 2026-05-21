/**
 * Task Row Component
 * Single task row in the table
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { Calendar, Clock, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { getStatusColor, getPriorityColor, getPriorityIcon } from '@/lib/domain-utils/ui-utils';
import { getPriorityLabel } from '@/lib/domain-utils/task-utils';

interface TaskRowProps {
  task: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
    tags: string[];
    estimatedHours?: number;
    actualHours?: number;
  };
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  onView: (task: TaskRowProps['task']) => void;
  onEdit: (task: TaskRowProps['task']) => void;
  onDelete: (taskId: string) => void;
}

export function TaskRow({
  task,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const progressPercentage = task.estimatedHours
    ? Math.min(100, ((task.actualHours || 0) / task.estimatedHours) * 100)
    : 0;

  const PriorityIcon = getPriorityIcon(task.priority);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(task.id)} />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{task.title}</div>
          {task.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {task.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <PriorityIcon className="h-3 w-3" />
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {task.assignee
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{task.assignee}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{task.dueDate || 'No due date'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {task.actualHours || 0}h / {task.estimatedHours || 0}h
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(task)}>
              <Eye className="h-3 w-3 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

