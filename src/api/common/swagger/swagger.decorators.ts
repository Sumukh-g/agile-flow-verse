import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

/**
 * Common Swagger decorators for consistent API documentation
 */

export function ApiPaginatedResponse<T>(description: string, type: any) {
  return applyDecorators(
    ApiOperation({ summary: description }),
    ApiResponse({
      status: 200,
      description,
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: `#/components/schemas/${type.name}` },
          },
          nextCursor: {
            type: 'string',
            nullable: true,
            description: 'Base64-encoded cursor for pagination',
          },
        },
      },
    }),
  );
}

export function ApiStandardResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input',
      schema: {
        type: 'object',
        properties: {
          traceId: { type: 'string' },
          code: { type: 'string', example: 'BadRequest' },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
      schema: {
        type: 'object',
        properties: {
          traceId: { type: 'string' },
          code: { type: 'string', example: 'Unauthorized' },
          message: { type: 'string', example: 'Invalid or missing authentication token' },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      schema: {
        type: 'object',
        properties: {
          traceId: { type: 'string' },
          code: { type: 'string', example: 'Forbidden' },
          message: { type: 'string', example: 'Insufficient permissions' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Resource does not exist',
      schema: {
        type: 'object',
        properties: {
          traceId: { type: 'string' },
          code: { type: 'string', example: 'NotFound' },
          message: { type: 'string', example: 'Resource not found' },
        },
      },
    }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded',
      schema: {
        type: 'object',
        properties: {
          traceId: { type: 'string' },
          code: { type: 'string', example: 'TooManyRequests' },
          message: { type: 'string', example: 'Rate limit exceeded' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          traceId: { type: 'string' },
          code: { type: 'string', example: 'InternalServerError' },
          message: { type: 'string', example: 'An unexpected error occurred' },
        },
      },
    }),
  );
}

export function ApiPaginationQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'cursor',
      required: false,
      description: 'Pagination cursor (base64-encoded)',
      type: String,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page (1-100)',
      type: Number,
      example: 25,
    }),
  );
}

export function ApiIdParam(description = 'Resource ID') {
  return ApiParam({
    name: 'id',
    description,
    type: String,
    example: 'clx1234567890abcdef',
  });
}

