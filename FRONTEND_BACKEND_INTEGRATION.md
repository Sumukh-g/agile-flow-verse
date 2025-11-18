# Frontend-Backend Integration Guide

This guide explains how to properly connect your frontend application to the enhanced backend system.

## 🔗 **Integration Overview**

The backend now provides comprehensive APIs that connect all frontend components:

- **Dashboard** ↔ Backend Analytics & Real-time Data
- **Calendar** ↔ Project Tasks & Deadlines
- **Projects** ↔ Full CRUD Operations
- **Tasks** ↔ Advanced Task Management
- **Notes** ↔ Rich Text & Attachments
- **Notifications** ↔ Real-time Updates

## 🚀 **Quick Start**

### 1. **Start the Backend**
```bash
cd src/api
npm install
npm run api:dev
```

### 2. **Configure Frontend**
The API client is already configured to connect to `http://localhost:3000/v1`

### 3. **Test Connection**
Visit `http://localhost:3000/v1/docs` to see the API documentation.

## 📊 **Dashboard Integration**

### **Backend Endpoint**: `GET /v1/dashboard`

**Frontend Usage**:
```typescript
import { useDashboard } from '@/hooks/useDashboard';

function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Recent Tasks: {dashboardData?.recentTasks?.length}</h1>
      <h1>Upcoming Tasks: {dashboardData?.upcomingTasks?.length}</h1>
      <h1>Project Stats: {dashboardData?.projectStats?.total}</h1>
    </div>
  );
}
```

**Data Structure**:
```typescript
interface DashboardData {
  recentTasks: Task[];
  upcomingTasks: Task[];
  projectStats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  recentActivity: Activity[];
  notifications: Notification[];
}
```

## 📅 **Calendar Integration**

### **Backend Endpoints**:
- `GET /v1/calendar/events` - All calendar events
- `GET /v1/calendar/personal` - Personal calendar
- `GET /v1/calendar/projects` - All projects calendar
- `GET /v1/calendar/projects/:id` - Specific project calendar

**Frontend Usage**:
```typescript
import { useCalendarEvents, usePersonalCalendar } from '@/hooks/useCalendar';

function CalendarHub() {
  const { data: allEvents } = useCalendarEvents();
  const { data: personalEvents } = usePersonalCalendar();
  
  return (
    <div>
      <h1>All Events: {allEvents?.length}</h1>
      <h1>Personal Events: {personalEvents?.length}</h1>
    </div>
  );
}
```

**Calendar Event Structure**:
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'task' | 'project';
  priority?: string;
  status?: string;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
  assignees?: User[];
  color: string;
  source: string;
}
```

## 🏗️ **Projects Integration**

### **Backend Endpoints**:
- `GET /v1/projects` - List projects
- `POST /v1/projects` - Create project
- `GET /v1/projects/:id` - Get project
- `PUT /v1/projects/:id` - Update project
- `DELETE /v1/projects/:id` - Delete project

**Frontend Usage**:
```typescript
import { useProjects, useCreateProject } from '@/hooks/useProjects';

function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  
  const handleCreateProject = async (data: CreateProjectDto) => {
    await createProject.mutateAsync(data);
  };
  
  return (
    <div>
      {projects?.map(project => (
        <div key={project.id}>
          <h2>{project.name}</h2>
          <p>Status: {project.status}</p>
          <p>Progress: {project.progress}%</p>
        </div>
      ))}
    </div>
  );
}
```

## ✅ **Tasks Integration**

### **Backend Endpoints**:
- `GET /v1/tasks` - List tasks
- `POST /v1/tasks` - Create task
- `GET /v1/tasks/:id` - Get task
- `PUT /v1/tasks/:id` - Update task
- `DELETE /v1/tasks/:id` - Delete task

**Frontend Usage**:
```typescript
import { useTasks, useCreateTask } from '@/hooks/useTasks';

function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  
  const handleCreateTask = async (data: CreateTaskDto) => {
    await createTask.mutateAsync(data);
  };
  
  return (
    <div>
      {tasks?.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>Status: {task.status}</p>
          <p>Priority: {task.priority}</p>
          <p>Due: {task.dueDate}</p>
        </div>
      ))}
    </div>
  );
}
```

## 📝 **Notes Integration**

### **Backend Endpoints**:
- `GET /v1/notes` - List notes
- `POST /v1/notes` - Create note
- `GET /v1/notes/:id` - Get note
- `PUT /v1/notes/:id` - Update note
- `DELETE /v1/notes/:id` - Delete note

**Frontend Usage**:
```typescript
import { useNotes, useCreateNote } from '@/hooks/useNotes';

function NotesPage() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();
  
  return (
    <div>
      {notes?.map(note => (
        <div key={note.id}>
          <h3>{note.title}</h3>
          <p>{note.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔔 **Notifications Integration**

### **Backend Endpoints**:
- `GET /v1/notifications` - List notifications
- `GET /v1/notifications/unread-count` - Get unread count
- `PUT /v1/notifications/mark-read` - Mark as read
- `PUT /v1/notifications/mark-all-read` - Mark all as read

**Frontend Usage**:
```typescript
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications';

function NotificationsPage() {
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  
  return (
    <div>
      <h1>Notifications ({unreadCount?.count})</h1>
      {notifications?.map(notification => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
}
```

## 📊 **Analytics Integration**

### **Backend Endpoints**:
- `GET /v1/analytics/projects/:id` - Project analytics
- `GET /v1/analytics/tasks` - Task analytics
- `GET /v1/analytics/users/:id` - User analytics
- `GET /v1/analytics/tenant` - Tenant analytics

**Frontend Usage**:
```typescript
import { useProjectAnalytics } from '@/hooks/useAnalytics';

function ProjectAnalytics({ projectId }: { projectId: string }) {
  const { data: analytics } = useProjectAnalytics(projectId);
  
  return (
    <div>
      <h1>Project Analytics</h1>
      <p>Total Tasks: {analytics?.tasks?.total}</p>
      <p>Completed: {analytics?.tasks?.completed}</p>
      <p>Progress: {analytics?.project?.progress}%</p>
    </div>
  );
}
```

## 🔍 **Search Integration**

### **Backend Endpoints**:
- `GET /v1/search` - Search across all entities
- `GET /v1/search/suggestions` - Get search suggestions
- `GET /v1/search/recent` - Get recent searches

**Frontend Usage**:
```typescript
import { useSearch } from '@/hooks/useSearch';

function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: results } = useSearch(query);
  
  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {results?.tasks?.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
      {results?.projects?.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

## 📁 **File Storage Integration**

### **Backend Endpoints**:
- `POST /v1/storage/upload` - Upload file
- `GET /v1/storage/attachments/:id` - Get attachment
- `GET /v1/storage/attachments/:id/download` - Download file
- `DELETE /v1/storage/attachments/:id` - Delete attachment

**Frontend Usage**:
```typescript
import { useUploadFile } from '@/hooks/useStorage';

function FileUpload({ noteId }: { noteId: string }) {
  const uploadFile = useUploadFile();
  
  const handleFileUpload = async (file: File) => {
    await uploadFile.mutateAsync({ file, noteId });
  };
  
  return (
    <input 
      type="file" 
      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
    />
  );
}
```

## 🔧 **Configuration**

### **Environment Variables**
```env
# Backend
DATABASE_URL="postgresql://user:password@localhost:5432/agile_flow_verse"
REDIS_URL="redis://localhost:6379"
KAFKA_BROKERS="localhost:9092"
JWT_SECRET="your-jwt-secret-key"
PORT=3000

# Frontend
VITE_API_URL="http://localhost:3000/v1"
```

### **API Client Configuration**
The API client automatically handles:
- Authentication headers
- Tenant context
- Request/response interceptors
- Error handling
- Retry logic

## 🚨 **Common Issues & Solutions**

### **1. CORS Issues**
```typescript
// Backend is configured with CORS enabled
app.use(cors());
```

### **2. Authentication Issues**
```typescript
// Make sure to set tenant ID in localStorage
localStorage.setItem('tenantId', 'your-tenant-id');
```

### **3. Data Not Loading**
```typescript
// Check if backend is running on port 3000
// Check browser network tab for API calls
// Verify API endpoints match frontend expectations
```

### **4. Real-time Updates**
```typescript
// Use React Query for automatic refetching
// Implement WebSocket connections for real-time updates
// Use polling for fallback
```

## 📈 **Performance Optimization**

### **Caching Strategy**
- React Query provides automatic caching
- Backend uses Redis for caching
- Cache invalidation on mutations

### **Data Fetching**
- Use `staleTime` to control cache duration
- Implement pagination for large datasets
- Use `enabled` option for conditional fetching

### **Real-time Updates**
- WebSocket connections for live updates
- Server-sent events for notifications
- Optimistic updates for better UX

## 🔐 **Security**

### **Authentication**
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
- Tenant isolation

### **Data Protection**
- Input validation on both frontend and backend
- SQL injection prevention
- XSS protection

## 🧪 **Testing**

### **Backend Testing**
```bash
# Run backend tests
cd src/api
npm run test

# Test specific endpoints
curl http://localhost:3000/v1/health
```

### **Frontend Testing**
```bash
# Run frontend tests
npm run test

# Test API integration
npm run test:integration
```

## 📚 **API Documentation**

Visit `http://localhost:3000/v1/docs` for interactive API documentation with:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests

## 🎯 **Next Steps**

1. **Start the backend**: `npm run api:dev`
2. **Test the connection**: Visit `/v1/docs`
3. **Update frontend components**: Use the provided hooks
4. **Implement real-time features**: Add WebSocket connections
5. **Add error handling**: Implement proper error boundaries
6. **Optimize performance**: Add caching and pagination

---

**Your backend is now fully connected and ready to power your frontend application! 🚀**





