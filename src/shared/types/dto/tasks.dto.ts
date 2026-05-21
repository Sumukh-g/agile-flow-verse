/**
 * Task DTOs with Zod Validation
 * Provides type-safe DTOs for task operations
 */

import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../enums';
import { cuidSchema, dateStringSchema } from './base.dto';

// ============================================
// CREATE TASK DTO
// ============================================

export const CreateTaskDtoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  description: z.string().max(5000, 'Description must be 5000 characters or less').optional(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  projectId: cuidSchema.optional().nullable(),
  parentId: cuidSchema.optional().nullable(), // For subtasks
  dueDate: dateStringSchema.optional().nullable(),
  estimatedHours: z.number().positive('Estimated hours must be positive').max(999).optional().nullable(),
  actualHours: z.number().nonnegative('Actual hours cannot be negative').max(999).optional().default(0),
  assigneeIds: z.array(cuidSchema).optional().default([]),
  dependencyIds: z.array(cuidSchema).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  isBlocked: z.boolean().optional().default(false),
  blockReason: z.string().max(500, 'Block reason must be 500 characters or less').optional().nullable(),
  customFields: z.record(z.any()).optional().nullable(), // JSON object for custom fields
});

export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;

// ============================================
// UPDATE TASK DTO
// ============================================

export const UpdateTaskDtoSchema = CreateTaskDtoSchema.partial().extend({
  title: z.string().min(1).max(500).optional(),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskDtoSchema>;

// ============================================
// TASK QUERY DTO
// ============================================

export const TaskQueryDtoSchema = z.object({
  projectId: z.string().optional(), // Can be 'personal' or CUID
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: cuidSchema.optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
  cursor: z.string().optional(),
});

export type TaskQueryDto = z.infer<typeof TaskQueryDtoSchema>;

// ============================================
// TASK ASSIGNEE DTOs
// ============================================

export const AddTaskAssigneeDtoSchema = z.object({
  userId: cuidSchema,
});

export type AddTaskAssigneeDto = z.infer<typeof AddTaskAssigneeDtoSchema>;

export const RemoveTaskAssigneeDtoSchema = z.object({
  userId: cuidSchema,
});

export type RemoveTaskAssigneeDto = z.infer<typeof RemoveTaskAssigneeDtoSchema>;

// ============================================
// TASK DEPENDENCY DTOs
// ============================================

export const AddTaskDependencyDtoSchema = z.object({
  taskId: cuidSchema,
});

export type AddTaskDependencyDto = z.infer<typeof AddTaskDependencyDtoSchema>;

export const RemoveTaskDependencyDtoSchema = z.object({
  taskId: cuidSchema,
});

export type RemoveTaskDependencyDto = z.infer<typeof RemoveTaskDependencyDtoSchema>;

// ============================================
// TIME LOG DTOs
// ============================================

export const CreateTimeLogDtoSchema = z.object({
  taskId: cuidSchema,
  startedAt: dateStringSchema,
  endedAt: dateStringSchema.optional().nullable(),
  duration: z.number().nonnegative('Duration cannot be negative').optional().default(0),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().nullable(),
});

export type CreateTimeLogDto = z.infer<typeof CreateTimeLogDtoSchema>;

export const UpdateTimeLogDtoSchema = CreateTimeLogDtoSchema.partial().extend({
  taskId: cuidSchema.optional(),
});

export type UpdateTimeLogDto = z.infer<typeof UpdateTimeLogDtoSchema>;

export const TimeLogQueryDtoSchema = z.object({
  taskId: cuidSchema.optional(),
  userId: cuidSchema.optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
  cursor: z.string().optional(),
});

export type TimeLogQueryDto = z.infer<typeof TimeLogQueryDtoSchema>;

