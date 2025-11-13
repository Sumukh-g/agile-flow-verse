import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: jest.Mocked<PrismaService>;
  let realtime: jest.Mocked<RealtimeService>;

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
      },
      taskDependency: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      projectMember: {
        findFirst: jest.fn(),
      },
      roleAssignment: {
        findFirst: jest.fn(),
      },
      outbox: {
        create: jest.fn(),
      },
    },
  };

  const mockRealtime = {
    broadcastTaskUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RealtimeService,
          useValue: mockRealtime,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get(PrismaService);
    realtime = module.get(RealtimeService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const tenantId = 'tenant1';
    const userId = 'user1';
    const projectId = 'project1';
    const createDto = {
      title: 'Test Task',
      description: 'Test Description',
      projectId,
      status: 'todo' as const,
      priority: 'medium' as const,
    };

    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task1',
        ...createDto,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.tx.projectMember.findFirst.mockResolvedValue({ id: 'member1' } as any);
      prisma.tx.task.create.mockResolvedValue(mockTask as any);
      prisma.tx.taskDependency.findMany.mockResolvedValue([]);
      prisma.tx.outbox.create.mockResolvedValue({} as any);
      realtime.broadcastTaskUpdate.mockResolvedValue(undefined);

      const result = await service.create(tenantId, userId, createDto);

      expect(result).toEqual(mockTask);
      expect(prisma.tx.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          projectId,
          tenantId,
        }),
      });
      expect(realtime.broadcastTaskUpdate).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not a project member', async () => {
      prisma.tx.projectMember.findFirst.mockResolvedValue(null);
      prisma.tx.roleAssignment.findFirst.mockResolvedValue(null);

      await expect(service.create(tenantId, userId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if task dependency cycle detected', async () => {
      prisma.tx.projectMember.findFirst.mockResolvedValue({ id: 'member1' } as any);
      prisma.tx.taskDependency.findMany.mockResolvedValue([
        { fromTaskId: 'task2', toTaskId: 'task1' },
      ] as any);

      const dtoWithCycle = {
        ...createDto,
        dependencyIds: ['task2'],
      };

      await expect(service.create(tenantId, userId, dtoWithCycle)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('list', () => {
    const tenantId = 'tenant1';
    const mockTasks = [
      { id: 'task1', title: 'Task 1', tenantId },
      { id: 'task2', title: 'Task 2', tenantId },
    ];

    it('should return paginated tasks', async () => {
      prisma.tx.task.findMany.mockResolvedValue(mockTasks as any);

      const result = await service.list(tenantId);

      expect(result.items).toHaveLength(2);
      expect(prisma.tx.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
          take: 26, // limit + 1 for cursor detection
        }),
      );
    });

    it('should filter by projectId when provided', async () => {
      const projectId = 'project1';
      prisma.tx.task.findMany.mockResolvedValue(mockTasks as any);

      await service.list(tenantId, projectId);

      expect(prisma.tx.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, projectId },
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
        projectId: 'project1',
        tenantId,
      };
      const updatedTask = {
        ...existingTask,
        ...updateDto,
        updatedAt: new Date(),
      };

      prisma.tx.task.findFirst.mockResolvedValue(existingTask as any);
      prisma.tx.projectMember.findFirst.mockResolvedValue({ id: 'member1' } as any);
      prisma.tx.task.update.mockResolvedValue(updatedTask as any);
      prisma.tx.outbox.create.mockResolvedValue({} as any);
      realtime.broadcastTaskUpdate.mockResolvedValue(undefined);

      const result = await service.update(tenantId, userId, taskId, updateDto);

      expect(result).toEqual(updatedTask);
      expect(prisma.tx.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: updateDto,
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

