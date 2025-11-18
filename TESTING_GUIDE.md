# 🧪 Testing Guide

## Overview

Comprehensive testing infrastructure for Agile Flow Verse with unit tests, integration tests, and E2E tests.

## Test Structure

```
src/api/
├── tasks/
│   ├── tasks.service.spec.ts    # Unit tests for TasksService
│   ├── tasks.controller.spec.ts # Controller tests
│   └── tasks.integration.spec.ts # Integration tests
└── ...
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### E2E Tests
```bash
npm run test:e2e
```

## Test Types

### Unit Tests
Test individual services and functions in isolation.

**Example:**
```typescript
describe('TasksService', () => {
  it('should create a task successfully', async () => {
    // Test implementation
  });
});
```

### Integration Tests
Test interactions between multiple services and database.

**Example:**
```typescript
describe('Tasks Integration', () => {
  it('should create task and update project', async () => {
    // Test with real database
  });
});
```

### E2E Tests
Test complete user flows end-to-end.

**Example:**
```typescript
describe('Task Management E2E', () => {
  it('should create, update, and delete a task', async () => {
    // Test complete flow
  });
});
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- Coverage collection
- Module path mapping
- Test timeout configuration

### Test Setup (`jest.setup.js`)
- Environment variable mocking
- Global test configuration

## Writing Tests

### Service Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Controller Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let service: jest.Mocked<TasksService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });
});
```

## Mocking

### Prisma Mock
```typescript
const mockPrisma = {
  tx: {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
};
```

### Service Mock
```typescript
const mockTasksService = {
  create: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

## Test Utilities

### Test Database
For integration tests, use a test database:

```typescript
// Setup test database
beforeAll(async () => {
  // Connect to test database
});

afterAll(async () => {
  // Cleanup test database
});
```

### Test Data Factories
Create reusable test data:

```typescript
export const createTestTask = (overrides = {}) => ({
  id: 'task1',
  title: 'Test Task',
  status: 'todo',
  priority: 'medium',
  projectId: 'project1',
  tenantId: 'tenant1',
  ...overrides,
});
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Best Practices

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should do something', () => {
     // Arrange
     const input = 'test';
     
     // Act
     const result = service.method(input);
     
     // Assert
     expect(result).toBe('expected');
   });
   ```

2. **Test One Thing**
   - Each test should verify one behavior
   - Use descriptive test names

3. **Mock External Dependencies**
   - Mock database calls
   - Mock external APIs
   - Mock file system operations

4. **Clean Up**
   - Reset mocks between tests
   - Clean up test data
   - Close connections

5. **Test Edge Cases**
   - Empty inputs
   - Invalid inputs
   - Boundary conditions
   - Error cases

## CI/CD Integration

Tests run automatically in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

## Debugging Tests

### VS Code Debugging
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Jest Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Next Steps

1. Add more test files for all services
2. Set up test database for integration tests
3. Add E2E test framework (Playwright/Cypress)
4. Set up CI/CD test pipeline
5. Add performance tests
6. Add load tests

