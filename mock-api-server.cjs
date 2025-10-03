const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockProjects = [
  {
    id: 'proj-1',
    name: 'Marketing Campaign',
    description: 'Q4 marketing campaign for new product launch',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'proj-2', 
    name: 'Website Redesign',
    description: 'Complete overhaul of company website',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'proj-3',
    name: 'Mobile App',
    description: 'Native mobile application development',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockTasks = [
  {
    id: 'task-1',
    title: 'Setup project infrastructure',
    description: 'Initialize the project with proper tooling and configuration',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Design user interface',
    description: 'Create wireframes and mockups for the main application',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: 'proj-2',
    assigneeId: 'user-2',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Implement authentication',
    description: 'Set up user authentication and authorization system',
    status: 'DONE',
    priority: 'HIGH',
    projectId: 'proj-1',
    assigneeId: 'user-3',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-4',
    title: 'Database schema design',
    description: 'Design and implement the database schema',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    projectId: 'proj-3',
    assigneeId: 'user-1',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-5',
    title: 'API documentation',
    description: 'Create comprehensive API documentation',
    status: 'TODO',
    priority: 'LOW',
    projectId: 'proj-2',
    assigneeId: 'user-2',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Middleware to handle authentication headers
app.use((req, res, next) => {
  // Log headers for debugging
  console.log('Request headers:', req.headers);
  next();
});

// Routes
app.get('/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/v1/projects', (req, res) => {
  res.json({ items: mockProjects });
});

app.get('/v1/tasks', (req, res) => {
  const { projectId } = req.query;
  let tasks = mockTasks;
  
  if (projectId) {
    tasks = mockTasks.filter(task => task.projectId === projectId);
  }
  
  res.json({ data: tasks });
});

app.get('/v1/tasks/:id', (req, res) => {
  const task = mockTasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.post('/v1/tasks', (req, res) => {
  const newTask = {
    id: `task-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockTasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/v1/tasks/:id', (req, res) => {
  const taskIndex = mockTasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  mockTasks[taskIndex] = {
    ...mockTasks[taskIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(mockTasks[taskIndex]);
});

app.delete('/v1/tasks/:id', (req, res) => {
  const taskIndex = mockTasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  mockTasks.splice(taskIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /v1/health');
  console.log('  GET /v1/projects');
  console.log('  GET /v1/tasks');
  console.log('  GET /v1/tasks/:id');
  console.log('  POST /v1/tasks');
  console.log('  PUT /v1/tasks/:id');
  console.log('  DELETE /v1/tasks/:id');
});
