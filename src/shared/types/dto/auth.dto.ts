/**
 * Authentication DTOs with Zod Validation
 */

import { z } from 'zod';
import { emailSchema } from './base.dto';

// ============================================
// LOGIN DTO
// ============================================

export const LoginDtoSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

// ============================================
// SIGNUP DTO
// ============================================

export const SignupDtoSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  tenantName: z.string().max(200, 'Tenant name must be 200 characters or less').optional(),
});

export type SignupDto = z.infer<typeof SignupDtoSchema>;

// ============================================
// REFRESH TOKEN DTO
// ============================================

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;

