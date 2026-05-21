/**
 * Note DTOs with Zod Validation
 */

import { z } from 'zod';
import { cuidSchema } from './base.dto';

// ============================================
// CREATE NOTE DTO
// ============================================

export const CreateNoteDtoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title must be 300 characters or less'),
  content: z.string().min(1, 'Content is required'), // Rich text JSON
  parentId: cuidSchema.optional(),
  projectId: cuidSchema,
  tags: z.array(z.string()).optional().default([]),
});

export type CreateNoteDto = z.infer<typeof CreateNoteDtoSchema>;

// ============================================
// UPDATE NOTE DTO
// ============================================

export const UpdateNoteDtoSchema = CreateNoteDtoSchema.partial().extend({
  title: z.string().min(1).max(300).optional(),
  content: z.string().optional(),
});

export type UpdateNoteDto = z.infer<typeof UpdateNoteDtoSchema>;

// ============================================
// NOTE QUERY DTO
// ============================================

export const NoteQueryDtoSchema = z.object({
  projectId: cuidSchema.optional(),
  parentId: cuidSchema.optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
  cursor: z.string().optional(),
});

export type NoteQueryDto = z.infer<typeof NoteQueryDtoSchema>;

