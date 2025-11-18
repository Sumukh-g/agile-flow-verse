# 📚 API Documentation Guide

## Overview

The Agile Flow Verse API has comprehensive OpenAPI/Swagger documentation that is automatically generated from code annotations.

## Accessing Documentation

### Development Environment
- **Swagger UI**: `http://localhost:3000/v1/docs`
- **OpenAPI JSON**: `http://localhost:3000/v1/docs-json`

### Production Environment
- **OpenAPI JSON**: `https://api.agileflowverse.com/v1/docs-json`
- Swagger UI is disabled in production for security

## Documentation Features

### ✅ Comprehensive Endpoint Documentation
- **Operation summaries** and descriptions
- **Request/response schemas** with examples
- **Query parameters** with validation rules
- **Path parameters** with descriptions
- **Error responses** with status codes

### ✅ Authentication Documentation
- Bearer token authentication clearly explained
- Multi-tenant architecture documented
- Rate limiting information
- Idempotency key usage

### ✅ Interactive Testing
- Try out endpoints directly from Swagger UI
- Automatic token persistence
- Request/response examples
- Error handling examples

## API Endpoints by Category

### Authentication (`/v1/auth`)
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Projects (`/v1/projects`)
- `POST /projects` - Create project
- `GET /projects` - List projects (paginated)
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks (`/v1/tasks`)
- `POST /tasks` - Create task
- `GET /tasks` - List tasks (paginated, filterable)
- `GET /tasks/:id` - Get task details
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Notes (`/v1/notes`)
- `POST /notes` - Create note
- `GET /notes` - List notes
- `GET /notes/:id` - Get note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### Dashboard (`/v1/dashboard`)
- `GET /dashboard` - Get dashboard data

### Calendar (`/v1/calendar`)
- `GET /calendar/events` - Get calendar events
- `GET /calendar/personal` - Get personal calendar
- `GET /calendar/projects` - Get projects calendar

### Notifications (`/v1/notifications`)
- `GET /notifications` - List notifications
- `PUT /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification

### Search (`/v1/search`)
- `GET /search` - Search across entities
- `GET /search/suggestions` - Get search suggestions
- `GET /search/recent` - Get recent searches

### Health (`/v1/health`)
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies

### Monitoring (`/v1/monitoring`)
- `GET /monitoring/system` - System metrics
- `GET /monitoring/tenant/:id` - Tenant metrics
- `GET /monitoring/performance` - Performance metrics
- `GET /monitoring/health` - Health status

## Request Examples

### Creating a Task

```bash
curl -X POST http://localhost:3000/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "title": "Implement user authentication",
    "description": "Implement JWT-based authentication system",
    "projectId": "proj123",
    "status": "todo",
    "priority": "medium",
    "estimatedHours": 8,
    "assigneeIds": ["user123", "user456"]
  }'
```

### Listing Tasks with Filters

```bash
curl -X GET "http://localhost:3000/v1/tasks?projectId=proj123&status=in-progress&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Pagination

```bash
# First page
curl -X GET "http://localhost:3000/v1/tasks?limit=25" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Next page (using cursor from previous response)
curl -X GET "http://localhost:3000/v1/tasks?limit=25&cursor=eyJpZCI6InRhc2sxMjMifQ" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Format

### Success Response
```json
{
  "id": "clx1234567890abcdef",
  "title": "Task Title",
  "status": "todo",
  "priority": "medium",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Paginated Response
```json
{
  "items": [...],
  "nextCursor": "eyJpZCI6InRhc2sxMjMifQ" // base64-encoded cursor
}
```

### Error Response
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "NotFound",
  "message": "Task not found",
  "details": {}
}
```

## Authentication

All endpoints (except `/v1/health`) require Bearer token authentication:

```bash
Authorization: Bearer <access_token>
```

Tokens are obtained from the `/v1/auth/login` endpoint and expire after 15 minutes. Use `/v1/auth/refresh` to get a new token.

## Rate Limiting

- **Production**: 100 requests per 15 minutes per tenant
- **Development**: 1000 requests per minute per tenant

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## Idempotency

Mutating requests (POST, PUT, PATCH, DELETE) support idempotency. Include an `Idempotency-Key` header:

```bash
Idempotency-Key: unique-request-id-123
```

Duplicate requests with the same key within 2 minutes will return the cached response.

## Multi-tenancy

Requests are automatically scoped to the tenant based on the JWT token. No need to manually specify tenant ID in most cases.

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BadRequest` | 400 | Invalid input parameters |
| `Unauthorized` | 401 | Invalid or missing token |
| `Forbidden` | 403 | Insufficient permissions |
| `NotFound` | 404 | Resource does not exist |
| `Conflict` | 409 | Resource conflict |
| `TooManyRequests` | 429 | Rate limit exceeded |
| `InternalServerError` | 500 | Server error |

## WebSocket API

Real-time updates are available via WebSocket:

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000/realtime', {
  auth: {
    token: 'YOUR_TOKEN',
    tenantId: 'tenant123'
  }
});

// Subscribe to task updates
socket.emit('subscribe', { channels: ['project:proj123'] });

// Listen for updates
socket.on('task.updated', (data) => {
  console.log('Task updated:', data);
});
```

## SDK Generation

The OpenAPI JSON can be used to generate client SDKs:

```bash
# Using openapi-generator
openapi-generator generate \
  -i http://localhost:3000/v1/docs-json \
  -g typescript-axios \
  -o ./generated-sdk
```

## Best Practices

1. **Always include Authorization header** for authenticated endpoints
2. **Use Idempotency-Key** for mutating operations
3. **Handle pagination** using cursors, not offsets
4. **Check rate limit headers** to avoid exceeding limits
5. **Use appropriate filters** to reduce response size
6. **Subscribe to WebSocket channels** for real-time updates
7. **Handle errors gracefully** using the error format

## Testing in Swagger UI

1. Visit `http://localhost:3000/v1/docs`
2. Click "Authorize" button
3. Enter your Bearer token: `Bearer YOUR_TOKEN`
4. Click "Authorize" to save
5. Try out any endpoint with the "Try it out" button
6. View request/response examples

## Updates

The API documentation is automatically updated when you:
- Add new endpoints
- Update DTOs with `@ApiProperty` decorators
- Add `@ApiOperation` decorators to controllers
- Update Swagger configuration in `main.ts`

