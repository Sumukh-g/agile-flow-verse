/**
 * Task Domain Utilities
 * Business logic for task status, priority, and formatting
 */

import { TaskStatus, TaskPriority } from '@/shared/types/enums';

/**
 * Map API status to display label
 */
export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    [TaskStatus.TODO]: 'To Do',
    [TaskStatus.IN_PROGRESS]: 'In Progress',
    [TaskStatus.REVIEW]: 'In Review',
    [TaskStatus.DONE]: 'Done',
    [TaskStatus.BLOCKED]: 'Blocked',
    [TaskStatus.CANCELLED]: 'Cancelled',
  };
  return statusMap[status] || status;
}

/**
 * Map display label to API status
 */
export function getStatusFromLabel(label: string): TaskStatus {
  const labelMap: Record<string, TaskStatus> = {
    'To Do': TaskStatus.TODO,
    'In Progress': TaskStatus.IN_PROGRESS,
    'In Review': TaskStatus.REVIEW,
    'Done': TaskStatus.DONE,
    'Blocked': TaskStatus.BLOCKED,
    'Cancelled': TaskStatus.CANCELLED,
  };
  return labelMap[label] || TaskStatus.TODO;
}

/**
 * Map API priority to display label
 */
export function getPriorityLabel(priority: string): string {
  const priorityMap: Record<string, string> = {
    [TaskPriority.LOW]: 'Low',
    [TaskPriority.MEDIUM]: 'Medium',
    [TaskPriority.HIGH]: 'High',
    [TaskPriority.CRITICAL]: 'Critical',
  };
  return priorityMap[priority] || priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Map display label to API priority
 */
export function getPriorityFromLabel(label: string): TaskPriority {
  const labelMap: Record<string, TaskPriority> = {
    'Low': TaskPriority.LOW,
    'Medium': TaskPriority.MEDIUM,
    'High': TaskPriority.HIGH,
    'Critical': TaskPriority.CRITICAL,
  };
  return labelMap[label] || TaskPriority.MEDIUM;
}

/**
 * Format date for display
 */
export function formatTaskDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Format hours for display
 */
export function formatHours(hours: number | null | undefined): string {
  if (!hours) return '0h';
  return `${hours}h`;
}

/**
 * Format duration in hours to human-readable format
 * 
 * Converts decimal hours (e.g., 2.5) to readable format (e.g., "2h 30m")
 * 
 * @param hours - Duration in decimal hours
 * @returns Formatted string like "2h 30m" or "45m" or "0h"
 * 
 * Examples:
 * - formatDuration(2.5) => "2h 30m"
 * - formatDuration(0.75) => "45m"
 * - formatDuration(3) => "3h"
 * - formatDuration(0) => "0h"
 */
export function formatDuration(hours: number): string {
  if (!hours || hours < 0) return '0h';
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Get assignee display name
 */
export function getAssigneeName(assignees?: Array<{ user?: { name?: string } }>): string {
  if (!assignees || assignees.length === 0) return 'Unassigned';
  if (assignees.length === 1) return assignees[0].user?.name || 'Unassigned';
  return `${assignees.length} assignees`;
}

/**
 * Get all available status options
 */
export function getStatusOptions(): Array<{ value: string; label: string }> {
  return [
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.REVIEW, label: 'In Review' },
    { value: TaskStatus.DONE, label: 'Done' },
    { value: TaskStatus.BLOCKED, label: 'Blocked' },
    { value: TaskStatus.CANCELLED, label: 'Cancelled' },
  ];
}

/**
 * Get all available priority options
 */
export function getPriorityOptions(): Array<{ value: string; label: string }> {
  return [
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
    { value: TaskPriority.CRITICAL, label: 'Critical' },
  ];
}

