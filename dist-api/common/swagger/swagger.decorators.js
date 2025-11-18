"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiPaginatedResponse = ApiPaginatedResponse;
exports.ApiStandardResponses = ApiStandardResponses;
exports.ApiPaginationQuery = ApiPaginationQuery;
exports.ApiIdParam = ApiIdParam;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
/**
 * Common Swagger decorators for consistent API documentation
 */
function ApiPaginatedResponse(description, type) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiOperation)({ summary: description }), (0, swagger_1.ApiResponse)({
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
    }));
}
function ApiStandardResponses() {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
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
    }), (0, swagger_1.ApiResponse)({
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
    }), (0, swagger_1.ApiResponse)({
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
    }), (0, swagger_1.ApiResponse)({
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
    }), (0, swagger_1.ApiResponse)({
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
    }), (0, swagger_1.ApiResponse)({
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
    }));
}
function ApiPaginationQuery() {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiQuery)({
        name: 'cursor',
        required: false,
        description: 'Pagination cursor (base64-encoded)',
        type: String,
    }), (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Number of items per page (1-100)',
        type: Number,
        example: 25,
    }));
}
function ApiIdParam(description = 'Resource ID') {
    return (0, swagger_1.ApiParam)({
        name: 'id',
        description,
        type: String,
        example: 'clx1234567890abcdef',
    });
}
