import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { CacheService } from '../common/cache/cache.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TaskStatus, TaskPriority } from '../../shared/types/enums';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: jest.Mocked<PrismaService>;
  let realtime: jest.Mocked<RealtimeService>;
  let permissions: jest.Mocked<ProjectPermissionsService>;

  const mockPrisma = {
    tx: {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      taskAssignee: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      taskDependency: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      project: {
        findMany: jest.fn(),
      },
      projectMember: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      outbox: {
        create: jest.fn(),
      },
    },
  };

  const mockRealtime = {
    broadcastTaskUpdate: jest.fn(),
  };

  const mockPermissions = {
    ensureCanReadProject: jest.fn(),
    ensureCanWriteProject: jest.fn(),
  };

  const mockCache = {
    invalidateTasks: jest.fn(),
    invalidateDashboard: jest.fn(),
  };

  const mockNotifications = {
    sendTaskNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealtimeService, useValue: mockRealtime },
        { provide: ProjectPermissionsService, useValue: mockPermissions },
        { provide: CacheService, useValue: mockCache },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get(PrismaService);
    realtime = module.get(RealtimeService);
    permissions = module.get(ProjectPermissionsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const tenantId = 'tenant1';
    const userId = 'user1';
    const projectId = 'cjld2cjxh0000qzrmn831i7rn';
    const createDto = {
      title: 'Test Task',
      description: 'Test Description',
      projectId,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    };

    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task1',
        ...createDto,
        tenantId,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      permissions.ensureCanWriteProject.mockResolvedValue(undefined);
      prisma.tx.task.create.mockResolvedValue(mockTask as any);
      prisma.tx.taskDependency.findMany.mockResolvedValue([]);
      prisma.tx.outbox.create.mockResolvedValue({} as any);
      realtime.broadcastTaskUpdate.mockResolvedValue(undefined);

      const result = await service.create(tenantId, userId, createDto);

      expect(result).toEqual(mockTask);
      expect(permissions.ensureCanWriteProject).toHaveBeenCalledWith(tenantId, userId, projectId);
      expect(prisma.tx.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          projectId,
          tenantId,
        }),
      });
      expect(realtime.broadcastTaskUpdate).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user cannot write the project', async () => {
      permissions.ensureCanWriteProject.mockRejectedValue(new ForbiddenException());

      await expect(service.create(tenantId, userId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if task dependency cycle detected', async () => {
      permissions.ensureCanWriteProject.mockResolvedValue(undefined);
      prisma.tx.task.create.mockResolvedValue({ id: 'cjld2cyuq0000t3rmniod1aaa', ...createDto, tenantId } as any);
      // Existing edge dep -> new task, so adding new task -> dep closes a cycle.
      prisma.tx.taskDependency.findMany.mockResolvedValue([
        { fromTaskId: 'cjld2cyuq0001t3rmniod1bbb', toTaskId: 'cjld2cyuq0000t3rmniod1aaa' },
      ] as any);

      const dtoWithCycle = {
        ...createDto,
        dependencyIds: ['cjld2cyuq0001t3rmniod1bbb'],
      };

      await expect(service.create(tenantId, userId, dtoWithCycle)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('list', () => {
    const tenantId = 'tenant1';
    const userId = 'user1';
    const mockTasks = [
      { id: 'task1', title: 'Task 1', tenantId },
      { id: 'task2', title: 'Task 2', tenantId },
    ];

    it('should return paginated tasks across accessible projects', async () => {
      prisma.tx.project.findMany.mockResolvedValue([] as any);
      prisma.tx.projectMember.findMany.mockResolvedValue([] as any);
      prisma.tx.task.findMany.mockResolvedValue(mockTasks as any);

      const result = await service.list(tenantId, userId, {});

      expect(result.items).toHaveLength(2);
      expect(prisma.tx.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 26, // limit + 1 for cursor detection
        }),
      );
    });

    it('should filter by projectId when provided', async () => {
      const projectId = 'cjld2cjxh0000qzrmn831i7rn';
      permissions.ensureCanReadProject.mockResolvedValue(undefined);
      prisma.tx.task.findMany.mockResolvedValue(mockTasks as any);

      await service.list(tenantId, userId, { projectId });

      expect(permissions.ensureCanReadProject).toHaveBeenCalledWith(tenantId, userId, projectId);
      expect(prisma.tx.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, projectId }),
        }),
      );
    });
  });

  describe('update', () => {
    const tenantId = 'tenant1';
    const userId = 'user1';
    const taskId = 'task1';
    const updateDto = { title: 'Updated Title' };

    it('should update a task successfully', async () => {
      const existingTask = {
        id: taskId,
        projectId: 'cjld2cjxh0000qzrmn831i7rn',
        status: TaskStatus.TODO,
        dueDate: null,
        tenantId,
      };
      const updatedTask = {
        ...existingTask,
        ...updateDto,
        updatedAt: new Date(),
      };

      prisma.tx.task.findFirst.mockResolvedValue(existingTask as any);
      permissions.ensureCanWriteProject.mockResolvedValue(undefined);
      prisma.tx.task.update.mockResolvedValue(updatedTask as any);
      prisma.tx.outbox.create.mockResolvedValue({} as any);
      realtime.broadcastTaskUpdate.mockResolvedValue(undefined);

      const result = await service.update(tenantId, userId, taskId, updateDto);

      expect(result).toEqual(updatedTask);
      expect(prisma.tx.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: expect.objectContaining({ title: 'Updated Title' }),
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      prisma.tx.task.findFirst.mockResolvedValue(null);

      await expect(service.update(tenantId, userId, taskId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
