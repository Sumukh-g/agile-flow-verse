/**
 * Task Filters Component
 * Filter controls for tasks list
 */

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { getStatusOptions, getPriorityOptions } from '@/lib/domain-utils/task-utils';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterPriority: string;
  onPriorityChange: (value: string) => void;
  filterAssignee: string;
  onAssigneeChange: (value: string) => void;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterPriority,
  onPriorityChange,
  filterAssignee,
  onAssigneeChange,
}: TaskFiltersProps) {
  const statusOptions = getStatusOptions();
  const priorityOptions = getPriorityOptions();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={onAssigneeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="John Doe">John Doe</SelectItem>
            <SelectItem value="Alice Smith">Alice Smith</SelectItem>
            <SelectItem value="Bob Wilson">Bob Wilson</SelectItem>
            <SelectItem value="Charlie Brown">Charlie Brown</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

