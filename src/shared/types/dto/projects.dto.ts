/**
 * Project DTOs with Zod Validation
 */

import { z } from 'zod';
import { ProjectStatus, ProjectPriority, ProjectMemberRole } from '../enums';
import { cuidSchema, dateStringSchema, emailSchema } from './base.dto';

// ============================================
// CREATE PROJECT DTO
// ============================================

export const CreateProjectDtoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.ACTIVE),
  priority: z.nativeEnum(ProjectPriority).optional().default(ProjectPriority.MEDIUM),
  progress: z.number().int().min(0).max(100).optional().default(0),
  budget: z.number().nonnegative().optional(),
  spent: z.number().nonnegative().optional().default(0),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
});

export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;

// ============================================
// UPDATE PROJECT DTO
// ============================================

export const UpdateProjectDtoSchema = CreateProjectDtoSchema.partial().extend({
  name: z.string().min(1).max(200).optional(),
});

export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;

// ============================================
// PROJECT QUERY DTO
// ============================================

export const ProjectQueryDtoSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.nativeEnum(ProjectPriority).optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
  cursor: z.string().optional(),
  showDeleted: z.boolean().optional().default(false),
  showArchived: z.boolean().optional().default(false),
});

export type ProjectQueryDto = z.infer<typeof ProjectQueryDtoSchema>;

// ============================================
// PROJECT MEMBER DTOs
// ============================================

export const AddProjectMemberDtoSchema = z.object({
  userId: cuidSchema.optional(),
  email: emailSchema.optional(),
  role: z.nativeEnum(ProjectMemberRole),
}).refine(
  (data) => data.userId || data.email,
  { message: 'Either userId or email must be provided' }
);

export type AddProjectMemberDto = z.infer<typeof AddProjectMemberDtoSchema>;

export const UpdateProjectMemberRoleDtoSchema = z.object({
  role: z.nativeEnum(ProjectMemberRole),
});

export type UpdateProjectMemberRoleDto = z.infer<typeof UpdateProjectMemberRoleDtoSchema>;

export const RemoveProjectMemberDtoSchema = z.object({
  userId: cuidSchema,
});

export type RemoveProjectMemberDto = z.infer<typeof RemoveProjectMemberDtoSchema>;

