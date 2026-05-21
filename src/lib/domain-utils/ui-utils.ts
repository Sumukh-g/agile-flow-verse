/**
 * UI Utilities
 * Color schemes, icons, and visual helpers
 */

import { cn } from '@/lib/utils';
import { TaskStatus, TaskPriority } from '@/shared/types/enums';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Flag,
  FlagOff,
  FlagIcon,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Get priority color classes
 */
export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    [TaskPriority.CRITICAL]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200',
    [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200',
    [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200',
    [TaskPriority.LOW]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200',
  };
  return colorMap[priority] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200';
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    [TaskStatus.TODO]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [TaskStatus.REVIEW]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [TaskStatus.DONE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [TaskStatus.BLOCKED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

/**
 * Get priority icon
 */
export function getPriorityIcon(priority: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    [TaskPriority.CRITICAL]: FlagIcon,
    [TaskPriority.HIGH]: Flag,
    [TaskPriority.MEDIUM]: FlagOff,
    [TaskPriority.LOW]: FlagOff,
  };
  return iconMap[priority] || FlagOff;
}

/**
 * Get status icon
 */
export function getStatusIcon(status: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    [TaskStatus.TODO]: Clock,
    [TaskStatus.IN_PROGRESS]: Clock,
    [TaskStatus.REVIEW]: AlertCircle,
    [TaskStatus.DONE]: CheckCircle2,
    [TaskStatus.BLOCKED]: XCircle,
    [TaskStatus.CANCELLED]: XCircle,
  };
  return iconMap[status] || Clock;
}

/**
 * Apply priority color to a className
 */
export function applyPriorityColor(priority: string, baseClasses?: string): string {
  return cn(baseClasses, getPriorityColor(priority));
}

/**
 * Apply status color to a className
 */
export function applyStatusColor(status: string, baseClasses?: string): string {
  return cn(baseClasses, getStatusColor(status));
}

/**
 * Get badge variant based on priority
 */
export function getPriorityVariant(priority: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (priority === TaskPriority.CRITICAL) return 'destructive';
  if (priority === TaskPriority.HIGH) return 'destructive';
  if (priority === TaskPriority.MEDIUM) return 'secondary';
  return 'outline';
}

/**
 * Get badge variant based on status
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === TaskStatus.DONE) return 'default';
  if (status === TaskStatus.BLOCKED || status === TaskStatus.CANCELLED) return 'destructive';
  if (status === TaskStatus.IN_PROGRESS) return 'default';
  return 'secondary';
}

