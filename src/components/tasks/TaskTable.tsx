/**
 * Task Table Component
 * Table wrapper for tasks with sorting
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, Layers, Plus } from 'lucide-react';
import { TaskRow } from './TaskRow';

interface Task {
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
}

interface TaskTableProps {
  tasks: Task[];
  selectedTasks: Set<string>;
  onSelectTask: (taskId: string) => void;
  onSelectAll: () => void;
  onSort: (key: keyof Task) => void;
  sortConfig: { key: keyof Task | null; direction: 'asc' | 'desc' };
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onCreateTask: () => void;
  searchQuery?: string;
  hasFilters?: boolean;
}

export function TaskTable({
  tasks,
  selectedTasks,
  onSelectTask,
  onSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onDelete,
  onCreateTask,
  searchQuery,
  hasFilters,
}: TaskTableProps) {
  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('title')}
                  className="h-auto p-0 font-medium"
                >
                  Task
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('status')}
                  className="h-auto p-0 font-medium"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('priority')}
                  className="h-auto p-0 font-medium"
                >
                  Priority
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('dueDate')}
                  className="h-auto p-0 font-medium"
                >
                  Due Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || hasFilters
                      ? 'Try adjusting your filters or search terms'
                      : 'Get started by creating your first task'}
                  </p>
                  {!searchQuery && !hasFilters && (
                    <Button onClick={onCreateTask}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onSelect={onSelectTask}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

