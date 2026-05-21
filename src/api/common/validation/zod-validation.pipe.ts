/**
 * Zod Validation Pipe
 * Validates DTOs using Zod schemas
 */

import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path ? `${path}: ` : ''}${err.message}`;
        });
        throw new BadRequestException({
          message: 'Validation failed',
          errors: messages,
          details: error.errors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

/**
 * Helper function to create a validation pipe from a Zod schema
 */
export function createZodValidationPipe(schema: ZodSchema) {
  return new ZodValidationPipe(schema);
}

