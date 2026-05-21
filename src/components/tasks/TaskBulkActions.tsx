/**
 * Task Bulk Actions Component
 * Bulk operations for selected tasks
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckSquare } from 'lucide-react';

interface TaskBulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: string) => void;
}

export function TaskBulkActions({ selectedCount, onBulkAction }: TaskBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <CheckSquare className="h-4 w-4 mr-2" />
          Bulk Actions ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onBulkAction('status')}>
          Update Status
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onBulkAction('assignee')}>
          Change Assignee
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onBulkAction('delete')}
          className="text-red-600"
        >
          Delete Tasks
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

