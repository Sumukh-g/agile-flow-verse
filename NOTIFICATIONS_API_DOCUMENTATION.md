# Notifications API Documentation

Complete API documentation for the Notifications Center feature.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Notifications](#notifications)
  - [Services](#services)
- [WebSocket Events](#websocket-events)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The Notifications API provides a comprehensive system for managing user notifications with support for:
- Multi-channel delivery (in-app, email, Slack, webhooks)
- Priority levels and categorization
- Archiving and bulk operations
- Service integration management
- Real-time updates via WebSocket

**Base URL**: `https://your-domain.com/v1/notifications`

**API Version**: v1

---

## Authentication

All API endpoints require JWT authentication via Bearer token.

### Headers Required:
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

The JWT token contains tenant and user information, which is automatically used to scope all operations.

---

## API Endpoints

### Notifications

#### GET /notifications

Retrieve user's notifications with optional filtering.

**Query Parameters:**
- `search` (optional): Search in title and message
- `type` (optional): Filter by notification type
- `read` (optional): Filter by read status (true/false)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `limit` (optional, default: 25): Number of items per page
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "tenantId": "tenant_abc",
      "userId": "user_xyz",
      "type": "task.assigned",
      "title": "Task Assigned: Implement Feature X",
      "message": "You have been assigned to the task 'Implement Feature X'",
      "data": {
        "taskId": "task_456",
        "assignedBy": "user_789"
      },
      "channels": ["in_app", "email"],
      "priority": "medium",
      "read": false,
      "readAt": null,
      "archived": false,
      "archivedAt": null,
      "source": "Internal",
      "category": "Work",
      "scheduledFor": "2025-01-07T10:00:00Z",
      "createdAt": "2025-01-07T10:00:00Z",
      "updatedAt": "2025-01-07T10:00:00Z"
    }
  ],
  "total": 42,
  "hasMore": true
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/v1/notifications?priority=high&read=false&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### GET /notifications/archived

Retrieve archived notifications.

**Query Parameters:**
- `search` (optional): Search in title and message
- `limit` (optional, default: 25): Number of items per page
- `offset` (optional, default: 0): Pagination offset

**Response:** Same structure as GET /notifications

---

#### GET /notifications/unread-count

Get the count of unread notifications.

**Response:**
```json
{
  "count": 5
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/v1/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### POST /notifications

Create a new notification.

**Request Body:**
```json
{
  "type": "task.assigned",
  "title": "Task Assigned",
  "message": "You have been assigned to a new task",
  "data": {
    "taskId": "task_123",
    "projectId": "project_456"
  },
  "channels": ["in_app", "email"],
  "priority": "medium",
  "scheduledFor": "2025-01-07T14:00:00Z"
}
```

**Response:**
```json
{
  "id": "notif_789",
  "tenantId": "tenant_abc",
  "userId": "user_xyz",
  "type": "task.assigned",
  "title": "Task Assigned",
  "message": "You have been assigned to a new task",
  "data": {
    "taskId": "task_123",
    "projectId": "project_456"
  },
  "channels": ["in_app", "email"],
  "priority": "medium",
  "read": false,
  "archived": false,
  "scheduledFor": "2025-01-07T14:00:00Z",
  "createdAt": "2025-01-07T10:30:00Z",
  "updatedAt": "2025-01-07T10:30:00Z"
}
```

**Example Request:**
```bash
curl -X POST "https://your-domain.com/v1/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task.assigned",
    "title": "New Task",
    "message": "You have a new task",
    "priority": "high"
  }'
```

---

#### PUT /notifications/mark-read

Mark specific notifications as read.

**Request Body:**
```json
{
  "notificationIds": ["notif_123", "notif_456"]
}
```

**Response:**
```json
{
  "count": 2
}
```

**Example Request:**
```bash
curl -X PUT "https://your-domain.com/v1/notifications/mark-read" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notificationIds": ["notif_123", "notif_456"]}'
```

---

#### PUT /notifications/mark-all-read

Mark all user's notifications as read.

**Request Body:** None

**Response:**
```json
{
  "count": 15
}
```

---

#### PUT /notifications/archive

Archive notifications.

**Request Body:**
```json
{
  "notificationIds": ["notif_123", "notif_456"]
}
```

**Response:**
```json
{
  "count": 2
}
```

---

#### PUT /notifications/unarchive

Unarchive notifications.

**Request Body:**
```json
{
  "notificationIds": ["notif_123", "notif_456"]
}
```

**Response:**
```json
{
  "count": 2
}
```

---

#### DELETE /notifications/:id

Delete a specific notification.

**URL Parameters:**
- `id`: The notification ID

**Response:**
```json
{
  "count": 1
}
```

**Example Request:**
```bash
curl -X DELETE "https://your-domain.com/v1/notifications/notif_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### DELETE /notifications/bulk

Delete multiple notifications.

**Request Body:**
```json
{
  "notificationIds": ["notif_123", "notif_456", "notif_789"]
}
```

**Response:**
```json
{
  "count": 3
}
```

---

### Services

#### GET /notifications/services

Get user's connected notification services.

**Response:**
```json
[
  {
    "id": "service_123",
    "tenantId": "tenant_abc",
    "userId": "user_xyz",
    "name": "Gmail",
    "icon": "Mail",
    "color": "bg-blue-500",
    "enabled": true,
    "connected": true,
    "category": "Work",
    "settings": {},
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-07T00:00:00Z"
  }
]
```

---

#### POST /notifications/services

Add a new notification service.

**Request Body:**
```json
{
  "name": "Slack",
  "category": "Work",
  "icon": "Slack",
  "color": "bg-purple-500"
}
```

**Response:**
```json
{
  "id": "service_456",
  "tenantId": "tenant_abc",
  "userId": "user_xyz",
  "name": "Slack",
  "icon": "Slack",
  "color": "bg-purple-500",
  "enabled": true,
  "connected": false,
  "category": "Work",
  "settings": {},
  "createdAt": "2025-01-07T10:45:00Z",
  "updatedAt": "2025-01-07T10:45:00Z"
}
```

**Example Request:**
```bash
curl -X POST "https://your-domain.com/v1/notifications/services" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack",
    "category": "Work",
    "icon": "Slack",
    "color": "bg-purple-500"
  }'
```

---

#### PUT /notifications/services/:id

Update a notification service.

**URL Parameters:**
- `id`: The service ID

**Request Body:**
```json
{
  "enabled": false,
  "connected": true
}
```

**Response:**
```json
{
  "count": 1
}
```

---

#### DELETE /notifications/services/:id

Delete a notification service.

**URL Parameters:**
- `id`: The service ID

**Response:**
```json
{
  "count": 1
}
```

---

## WebSocket Events

### Connection

Connect to the WebSocket server for real-time notifications:

```javascript
import io from 'socket.io-client';

const socket = io('wss://your-domain.com/realtime', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
    tenantId: 'YOUR_TENANT_ID'
  }
});
```

### Events

#### notification.new

Emitted when a new notification is created for the user.

**Event Data:**
```json
{
  "id": "notif_999",
  "type": "task.assigned",
  "title": "New Task Assigned",
  "message": "You have been assigned to task 'Urgent Bug Fix'",
  "priority": "urgent",
  "createdAt": "2025-01-07T11:00:00Z"
}
```

**Example Listener:**
```javascript
socket.on('notification.new', (notification) => {
  console.log('New notification:', notification);
  // Update UI, show toast, etc.
});
```

---

## Data Models

### Notification

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique notification ID |
| tenantId | string | Tenant ID |
| userId | string | User ID |
| type | string | Notification type (e.g., "task.assigned") |
| title | string | Notification title |
| message | string | Notification message |
| data | object | Additional data payload |
| channels | string[] | Delivery channels |
| priority | string | Priority level: low, medium, high, urgent |
| read | boolean | Read status |
| readAt | Date\|null | When notification was read |
| archived | boolean | Archive status |
| archivedAt | Date\|null | When notification was archived |
| source | string\|null | Source service name |
| category | string\|null | Category: Important, Social, Work |
| scheduledFor | Date | When to send notification |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

### NotificationService

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique service ID |
| tenantId | string | Tenant ID |
| userId | string | User ID |
| name | string | Service name (e.g., "Gmail") |
| icon | string | Icon identifier |
| color | string | Color class (e.g., "bg-blue-500") |
| enabled | boolean | Whether service is enabled |
| connected | boolean | Whether service is connected |
| category | string | Category: Important, Social, Work |
| settings | object | Service-specific settings |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

---

## Error Handling

### Error Response Format

```json
{
  "traceId": "abc123def456",
  "code": "NOTIFICATION_NOT_FOUND",
  "message": "The requested notification was not found",
  "details": {
    "notificationId": "notif_123"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing authentication token |
| FORBIDDEN | 403 | User doesn't have access to this resource |
| NOTIFICATION_NOT_FOUND | 404 | Notification doesn't exist |
| SERVICE_NOT_FOUND | 404 | Service doesn't exist |
| VALIDATION_ERROR | 400 | Request validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Examples

### Complete Workflow Example

```javascript
// 1. Fetch initial notifications
const response = await fetch('https://your-domain.com/v1/notifications?limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { notifications } = await response.json();

// 2. Get unread count
const countResponse = await fetch('https://your-domain.com/v1/notifications/unread-count', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { count } = await countResponse.json();

// 3. Mark notifications as read
await fetch('https://your-domain.com/v1/notifications/mark-read', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notificationIds: ['notif_1', 'notif_2']
  })
});

// 4. Archive old notifications
await fetch('https://your-domain.com/v1/notifications/archive', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notificationIds: ['notif_3', 'notif_4']
  })
});

// 5. Connect to WebSocket for real-time updates
const socket = io('wss://your-domain.com/realtime', {
  auth: { token, tenantId }
});

socket.on('notification.new', (notification) => {
  // Add new notification to UI
  console.log('Real-time notification:', notification);
});
```

### Using with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch notifications
const { data, isLoading } = useQuery({
  queryKey: ['notifications'],
  queryFn: () => fetch('/v1/notifications').then(r => r.json())
});

// Mark as read mutation
const queryClient = useQueryClient();
const markAsReadMutation = useMutation({
  mutationFn: (ids: string[]) =>
    fetch('/v1/notifications/mark-read', {
      method: 'PUT',
      body: JSON.stringify({ notificationIds: ids })
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }
});

// Usage
markAsReadMutation.mutate(['notif_1', 'notif_2']);
```

---

## Rate Limiting

- **Rate Limit**: 100 requests per minute per user
- **Burst Limit**: 20 requests per second
- **Headers**: Rate limit information is included in response headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704629400
```

---

## Pagination

For endpoints returning lists, use `limit` and `offset` parameters:

```
GET /v1/notifications?limit=25&offset=0   # First page
GET /v1/notifications?limit=25&offset=25  # Second page
GET /v1/notifications?limit=25&offset=50  # Third page
```

The response includes a `hasMore` boolean indicating if more results are available.

---

## Best Practices

### Performance
1. Use appropriate `limit` values to avoid large payloads
2. Leverage caching with the `staleTime` option in React Query
3. Subscribe to WebSocket only on pages that need real-time updates
4. Use bulk operations when possible

### Security
1. Never expose JWT tokens in client-side code
2. Implement proper CORS configuration
3. Validate all user input on the backend
4. Use HTTPS in production

### User Experience
1. Show loading states during API calls
2. Provide clear error messages
3. Implement optimistic updates for instant feedback
4. Show toast notifications for high-priority items

---

## Support

For questions or issues, please contact:
- Email: support@your-domain.com
- Documentation: https://docs.your-domain.com
- GitHub: https://github.com/your-org/your-repo

---

**Last Updated**: January 7, 2025  
**API Version**: 1.0.0

