# Notifications Center - Verification Checklist

Complete verification checklist for the Notifications Center feature. Use this to ensure all functionality works end-to-end.

## Pre-Deployment Checklist

### ✅ 1. Database Setup

- [ ] **Apply Migration**
  ```bash
  # Apply the notification features migration
  psql -d your_database -f prisma/migrations/20250107000000_add_notification_features/migration.sql
  ```
  - Expected: Tables created successfully
  - Verify: `notifications` table has new columns (archived, source, category)
  - Verify: `notification_services` table exists

- [ ] **Generate Prisma Client**
  ```bash
  npx prisma generate
  ```
  - Expected: No errors, client regenerated with new models

- [ ] **Verify Database Schema**
  ```sql
  -- Check notifications table
  \d notifications
  
  -- Check notification_services table
  \d notification_services
  ```

### ✅ 2. Backend Setup

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```
  - Expected: All packages installed without errors

- [ ] **Build Backend**
  ```bash
  npm run api:build
  ```
  - Expected: TypeScript compiles without errors

- [ ] **Run Backend Tests**
  ```bash
  npm test -- src/api/notifications
  ```
  - Expected: All tests pass
  - Verify: Test coverage > 80%

- [ ] **Start Backend Server**
  ```bash
  npm run api:dev
  ```
  - Expected: Server starts on port 3000
  - Expected: No TypeScript errors
  - Check logs for: "Application is running on: http://localhost:3000"

### ✅ 3. Frontend Setup

- [ ] **Install Frontend Dependencies**
  ```bash
  npm install
  ```

- [ ] **Run Frontend Tests**
  ```bash
  npm test -- src/hooks/useNotifications
  ```
  - Expected: All tests pass

- [ ] **Start Frontend**
  ```bash
  npm run dev
  ```
  - Expected: Vite starts successfully
  - Expected: No compilation errors

---

## Functional Testing

### ✅ 4. API Endpoint Testing

Use Swagger UI at `http://localhost:3000/v1/docs` or cURL commands:

#### GET /v1/notifications
- [ ] **Test without filters**
  ```bash
  curl -X GET "http://localhost:3000/v1/notifications" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns notifications list
  - Expected: Status 200
  - Verify: Response includes notifications, total, hasMore

- [ ] **Test with filters**
  ```bash
  curl -X GET "http://localhost:3000/v1/notifications?priority=high&read=false" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns filtered results
  - Verify: Only high priority unread notifications

- [ ] **Test search**
  ```bash
  curl -X GET "http://localhost:3000/v1/notifications?search=task" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns notifications matching "task"

#### POST /v1/notifications
- [ ] **Create notification**
  ```bash
  curl -X POST "http://localhost:3000/v1/notifications" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "task.assigned",
      "title": "Test Notification",
      "message": "This is a test",
      "priority": "high"
    }'
  ```
  - Expected: Returns created notification
  - Expected: Status 201
  - Verify: notification appears in GET /notifications

#### GET /v1/notifications/unread-count
- [ ] **Get unread count**
  ```bash
  curl -X GET "http://localhost:3000/v1/notifications/unread-count" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns { count: <number> }
  - Verify: Count matches actual unread notifications

#### PUT /v1/notifications/mark-read
- [ ] **Mark as read**
  ```bash
  curl -X PUT "http://localhost:3000/v1/notifications/mark-read" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"notificationIds": ["<notification_id>"]}'
  ```
  - Expected: Returns { count: 1 }
  - Verify: Notification marked as read

#### PUT /v1/notifications/mark-all-read
- [ ] **Mark all as read**
  ```bash
  curl -X PUT "http://localhost:3000/v1/notifications/mark-all-read" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns count
  - Verify: All notifications marked as read

#### PUT /v1/notifications/archive
- [ ] **Archive notifications**
  ```bash
  curl -X PUT "http://localhost:3000/v1/notifications/archive" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"notificationIds": ["<notification_id>"]}'
  ```
  - Expected: Returns { count: 1 }
  - Verify: Notification archived

#### GET /v1/notifications/archived
- [ ] **Get archived notifications**
  ```bash
  curl -X GET "http://localhost:3000/v1/notifications/archived" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns archived notifications only

#### DELETE /v1/notifications/:id
- [ ] **Delete notification**
  ```bash
  curl -X DELETE "http://localhost:3000/v1/notifications/<notification_id>" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns { count: 1 }
  - Verify: Notification deleted

#### GET /v1/notifications/services
- [ ] **Get services**
  ```bash
  curl -X GET "http://localhost:3000/v1/notifications/services" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns list of services
  - Verify: Default services created from migration

#### POST /v1/notifications/services
- [ ] **Create service**
  ```bash
  curl -X POST "http://localhost:3000/v1/notifications/services" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Service",
      "category": "Work",
      "icon": "Bell",
      "color": "bg-gray-500"
    }'
  ```
  - Expected: Returns created service
  - Verify: Service appears in services list

#### PUT /v1/notifications/services/:id
- [ ] **Update service**
  ```bash
  curl -X PUT "http://localhost:3000/v1/notifications/services/<service_id>" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"enabled": false}'
  ```
  - Expected: Returns { count: 1 }
  - Verify: Service disabled

#### DELETE /v1/notifications/services/:id
- [ ] **Delete service**
  ```bash
  curl -X DELETE "http://localhost:3000/v1/notifications/services/<service_id>" \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Expected: Returns { count: 1 }
  - Verify: Service deleted

---

## UI/UX Testing

### ✅ 5. Frontend Components

Navigate to `http://localhost:5173/notifications`

#### Initial Load
- [ ] **Page loads without errors**
  - No console errors
  - No React warnings
  - No TypeScript errors

- [ ] **Loading states display**
  - Spinner shows while loading notifications
  - Spinner shows while loading services
  - Skeleton screens (if implemented)

- [ ] **Data displays correctly**
  - Notifications list populates
  - Services panel shows services
  - Unread count badge shows correct number

#### Notifications List
- [ ] **Display notifications**
  - Notifications render with title, message
  - Timestamp displays correctly
  - Read/unread status visible
  - Priority badges show correct colors
  - Category badges display

- [ ] **Mark as read**
  - Click mark as read on a notification
  - Expected: Notification background changes
  - Expected: Unread count decreases
  - Expected: Success toast appears

- [ ] **Archive notification**
  - Click archive from dropdown
  - Expected: Notification disappears from list
  - Expected: Success toast appears
  - Expected: Notification appears when "Show Archived" is toggled

- [ ] **Delete notification**
  - Click delete from dropdown
  - Expected: Notification removed permanently
  - Expected: Success toast appears

- [ ] **Mark all as read**
  - Click "Mark all as read" button
  - Expected: All notifications marked as read
  - Expected: Unread count becomes 0
  - Expected: Success toast appears

#### Search and Filters
- [ ] **Search functionality**
  - Type in search box
  - Expected: Results filter in real-time
  - Expected: No matches shows empty state
  - Clear search shows all notifications again

- [ ] **Category filter**
  - Select "Important" from dropdown
  - Expected: Only Important notifications show
  - Select "Social"
  - Expected: Only Social notifications show
  - Select "All Categories"
  - Expected: All notifications show

- [ ] **Priority filter**
  - Select "High" from dropdown
  - Expected: Only high priority notifications show
  - Test each priority level
  - Expected: Filtering works correctly

#### Services Panel
- [ ] **Display services**
  - Services list populates
  - Service icons display
  - Category badges show
  - Enable/disable toggles work

- [ ] **Add service**
  - Click "+" button
  - Expected: Dialog opens
  - Fill in service name and category
  - Click "Add Service"
  - Expected: Service added to list
  - Expected: Success toast appears

- [ ] **Toggle service**
  - Click enable/disable switch
  - Expected: Switch toggles immediately
  - Expected: Service state updates

- [ ] **Remove service**
  - Click three-dot menu
  - Select "Remove"
  - Expected: Service removed
  - Expected: Success toast appears

#### Show/Hide Archived
- [ ] **Toggle archived view**
  - Click "Show archived" button
  - Expected: Archived notifications appear
  - Expected: Button text changes to "Hide archived"
  - Click again
  - Expected: Archived notifications hidden

#### Refresh
- [ ] **Refresh button**
  - Click refresh button
  - Expected: Loading indicator shows
  - Expected: Data refreshes
  - Expected: Latest notifications appear

---

## Real-time Testing

### ✅ 6. WebSocket Integration

- [ ] **Connection established**
  - Open browser console
  - Check for: "[Realtime] Connected"
  - Verify: No connection errors

- [ ] **Receive real-time notifications**
  - Create a notification via API
  ```bash
  curl -X POST "http://localhost:3000/v1/notifications" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "system",
      "title": "Real-time Test",
      "message": "Testing WebSocket",
      "priority": "urgent"
    }'
  ```
  - Expected: Notification appears in UI without refresh
  - Expected: Unread count updates automatically
  - Expected: Toast notification appears (for high/urgent)

- [ ] **Disconnect handling**
  - Stop backend server
  - Expected: UI continues to work (offline queue)
  - Restart backend
  - Expected: Reconnection happens automatically
  - Expected: Data syncs

---

## Error Handling

### ✅ 7. Error Scenarios

- [ ] **Network error**
  - Disconnect internet
  - Try to perform an action
  - Expected: Error toast appears
  - Expected: Action queued for later (if mutation)

- [ ] **Authentication error**
  - Use invalid token
  - Expected: 401 error
  - Expected: Redirect to login (if configured)

- [ ] **Not found error**
  - Try to delete non-existent notification
  - Expected: Appropriate error message

- [ ] **Validation error**
  - Send invalid data to API
  - Expected: 400 error with details

---

## Performance Testing

### ✅ 8. Performance

- [ ] **Large dataset**
  - Create 100+ notifications
  - Expected: Page loads < 2 seconds
  - Expected: Smooth scrolling
  - Expected: No lag in UI interactions

- [ ] **Pagination**
  - Verify pagination works with large dataset
  - Expected: Only requested items loaded

- [ ] **Real-time updates**
  - Send multiple notifications rapidly
  - Expected: UI updates without freezing
  - Expected: No memory leaks

- [ ] **Caching**
  - Navigate away and back
  - Expected: Data loads from cache immediately
  - Expected: Background refetch happens

---

## Security Testing

### ✅ 9. Security

- [ ] **Authentication required**
  - Try to access without token
  - Expected: 401 Unauthorized

- [ ] **Authorization checks**
  - Try to access another user's notifications
  - Expected: 403 Forbidden or empty results

- [ ] **Input validation**
  - Send malformed data
  - Expected: Proper validation errors
  - Expected: No SQL injection possible

- [ ] **XSS prevention**
  - Create notification with `<script>alert('xss')</script>` in message
  - Expected: Script not executed
  - Expected: Content escaped properly

---

## Accessibility Testing

### ✅ 10. Accessibility

- [ ] **Keyboard navigation**
  - Navigate using Tab key
  - Expected: All interactive elements accessible
  - Expected: Focus visible

- [ ] **Screen reader**
  - Use screen reader (e.g., NVDA, JAWS)
  - Expected: Content announced properly
  - Expected: ARIA labels present

- [ ] **Color contrast**
  - Check all text has sufficient contrast
  - Use browser tools or axe DevTools
  - Expected: WCAG AA compliance

- [ ] **Responsive design**
  - Test on mobile (375px width)
  - Test on tablet (768px width)
  - Test on desktop (1920px width)
  - Expected: Layout adapts properly

---

## Integration Testing

### ✅ 11. Integration with Other Features

- [ ] **Task notifications**
  - Create a task and assign to user
  - Expected: Notification created automatically
  - Expected: Task ID in notification data

- [ ] **Project notifications**
  - Update a project
  - Expected: Team members notified

- [ ] **Comment notifications**
  - Add comment and mention user
  - Expected: User receives notification

---

## Browser Compatibility

### ✅ 12. Cross-Browser Testing

- [ ] **Chrome** (latest)
  - All functionality works
  - No console errors

- [ ] **Firefox** (latest)
  - All functionality works
  - No console errors

- [ ] **Safari** (latest)
  - All functionality works
  - WebSocket works properly

- [ ] **Edge** (latest)
  - All functionality works
  - No console errors

---

## Production Readiness

### ✅ 13. Final Checks

- [ ] **Environment variables**
  - Production DATABASE_URL configured
  - API URLs point to production
  - WebSocket URL correct

- [ ] **Logging**
  - Error logging works
  - Important events logged
  - No sensitive data in logs

- [ ] **Monitoring**
  - Health check endpoint responds
  - Metrics collection working
  - Alerts configured

- [ ] **Documentation**
  - API documentation complete
  - README updated
  - Code comments present

- [ ] **Backup & Recovery**
  - Database backups configured
  - Recovery process tested

---

## Sign-Off

### Completed By:
- **Name**: _________________________
- **Date**: _________________________
- **Role**: _________________________

### Issues Found:
1. _________________________________________
2. _________________________________________
3. _________________________________________

### Status:
- [ ] ✅ Ready for Production
- [ ] ⚠️ Minor Issues (deploy with caveats)
- [ ] ❌ Major Issues (do not deploy)

### Notes:
_________________________________________________
_________________________________________________
_________________________________________________

---

**Checklist Version**: 1.0  
**Last Updated**: January 7, 2025

