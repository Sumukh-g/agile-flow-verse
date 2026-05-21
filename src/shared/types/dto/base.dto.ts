/**
 * Base DTOs and Common Validation Schemas
 * Provides foundation for all DTOs with Zod validation
 */

import { z } from 'zod';

/**
 * CUID validation schema
 */
export const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format');

/**
 * Generic pagination DTO schema
 */
export const PaginationDtoSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(25),
  cursor: z.string().optional(),
  offset: z.number().int().min(0).optional(),
});

export type PaginationDto = z.infer<typeof PaginationDtoSchema>;

/**
 * Generic query DTO with search
 */
export const QueryDtoSchema = PaginationDtoSchema.extend({
  search: z.string().optional(),
});

export type QueryDto = z.infer<typeof QueryDtoSchema>;

/**
 * Date string validation (ISO 8601)
 */
export const dateStringSchema = z.string().datetime().or(z.string().date());

/**
 * Email validation
 */
export const emailSchema = z.string().email();

/**
 * Base DTO class with validation
 * All DTOs should extend this or use Zod schemas
 */
export abstract class BaseDto {
  abstract validate(): void;
}

