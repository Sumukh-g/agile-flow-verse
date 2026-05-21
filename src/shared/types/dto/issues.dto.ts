/**
 * Issue DTOs with Zod Validation
 */

import { z } from 'zod';
import { IssueStatus, IssueType, IssuePriority, IssueSeverity } from '../enums';
import { cuidSchema, dateStringSchema } from './base.dto';

// ============================================
// CREATE ISSUE DTO
// ============================================

export const CreateIssueDtoSchema = z.object({
  projectId: cuidSchema,
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  description: z.string().max(5000, 'Description must be 5000 characters or less').optional(),
  status: z.nativeEnum(IssueStatus).optional().default(IssueStatus.INBOX),
  priority: z.nativeEnum(IssuePriority).optional().default(IssuePriority.P2),
  type: z.nativeEnum(IssueType).optional().default(IssueType.TASK),
  severity: z.nativeEnum(IssueSeverity).optional(),
  assigneeId: cuidSchema.optional(),
  tags: z.array(z.string()).optional().default([]),
  dueDate: dateStringSchema.optional(),
  componentId: z.string().optional(),
});

export type CreateIssueDto = z.infer<typeof CreateIssueDtoSchema>;

// ============================================
// UPDATE ISSUE DTO
// ============================================

export const UpdateIssueDtoSchema = CreateIssueDtoSchema.partial().extend({
  title: z.string().min(1).max(500).optional(),
  projectId: cuidSchema.optional(), // Allow moving issues between projects
});

export type UpdateIssueDto = z.infer<typeof UpdateIssueDtoSchema>;

// ============================================
// ISSUE QUERY DTO
// ============================================

export const IssueQueryDtoSchema = z.object({
  projectId: cuidSchema.optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  type: z.nativeEnum(IssueType).optional(),
  assigneeId: cuidSchema.optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'dueDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type IssueQueryDto = z.infer<typeof IssueQueryDtoSchema>;

// ============================================
// ISSUE COMMENT DTO
// ============================================

export const CreateIssueCommentDtoSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

export type CreateIssueCommentDto = z.infer<typeof CreateIssueCommentDtoSchema>;

