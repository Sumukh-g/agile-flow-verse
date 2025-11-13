import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '../common/kafka/kafka.service';
import { RedisClient } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, NotificationsService, NotificationType } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let kafka: KafkaService;
  let redis: RedisClient;

  const mockPrismaService = {
    tx: {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      notificationService: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    },
  };

  const mockKafkaService = {
    send: jest.fn(),
  };

  const mockRedisClient = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: RedisClient,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    kafka = module.get<KafkaService>(KafkaService);
    redis = module.get<RedisClient>(RedisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotification = {
        id: 'notif123',
        tenantId: 'tenant123',
        userId: 'user123',
        type: NotificationType.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: 'You have been assigned to a task',
        data: {},
        channels: [NotificationChannel.IN_APP],
        priority: 'medium',
        read: false,
        archived: false,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tx.notification.create.mockResolvedValue(mockNotification);
      mockKafkaService.send.mockResolvedValue(undefined);

      const result = await service.createNotification({
        tenantId: 'tenant123',
        userId: 'user123',
        type: NotificationType.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: 'You have been assigned to a task',
      });

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.tx.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant123',
          userId: 'user123',
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: 'You have been assigned to a task',
        }),
      });
      expect(mockKafkaService.send).toHaveBeenCalledWith(
        'notifications.created',
        expect.objectContaining({
          notificationId: 'notif123',
          tenantId: 'tenant123',
          userId: 'user123',
        })
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications with filters', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          title: 'Test Notification 1',
          read: false,
          archived: false,
        },
        {
          id: 'notif2',
          title: 'Test Notification 2',
          read: true,
          archived: false,
        },
      ];

      mockPrismaService.tx.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.tx.notification.count.mockResolvedValue(2);

      const result = await service.getUserNotifications('tenant123', 'user123', {
        limit: 25,
        offset: 0,
      });

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 2,
        hasMore: false,
      });
      expect(mockPrismaService.tx.notification.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: 'tenant123',
          userId: 'user123',
          archived: false,
        }),
        orderBy: { createdAt: 'desc' },
        take: 25,
        skip: 0,
      });
    });

    it('should filter by read status', async () => {
      mockPrismaService.tx.notification.findMany.mockResolvedValue([]);
      mockPrismaService.tx.notification.count.mockResolvedValue(0);

      await service.getUserNotifications('tenant123', 'user123', {
        read: false,
        limit: 25,
        offset: 0,
      });

      expect(mockPrismaService.tx.notification.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          read: false,
        }),
        orderBy: { createdAt: 'desc' },
        take: 25,
        skip: 0,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return cached unread count if available', async () => {
      mockRedisClient.get.mockResolvedValue('5');

      const result = await service.getUnreadCount('tenant123', 'user123');

      expect(result).toBe(5);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        'notifications:unread:tenant123:user123'
      );
      expect(mockPrismaService.tx.notification.count).not.toHaveBeenCalled();
    });

    it('should query database and cache if not in cache', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockPrismaService.tx.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('tenant123', 'user123');

      expect(result).toBe(3);
      expect(mockPrismaService.tx.notification.count).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant123',
          userId: 'user123',
          read: false,
        },
      });
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'notifications:unread:tenant123:user123',
        300,
        '3'
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark specific notifications as read', async () => {
      const notificationIds = ['notif1', 'notif2'];
      mockPrismaService.tx.notification.updateMany.mockResolvedValue({ count: 2 });
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.markAsRead('tenant123', 'user123', {
        notificationIds,
      });

      expect(result.count).toBe(2);
      expect(mockPrismaService.tx.notification.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant123',
          userId: 'user123',
          id: { in: notificationIds },
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should mark all notifications of a type as read', async () => {
      mockPrismaService.tx.notification.updateMany.mockResolvedValue({ count: 5 });
      mockRedisClient.del.mockResolvedValue(1);

      await service.markAsRead('tenant123', 'user123', {
        type: NotificationType.TASK_ASSIGNED,
      });

      expect(mockPrismaService.tx.notification.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant123',
          userId: 'user123',
          type: NotificationType.TASK_ASSIGNED,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('archiveNotifications', () => {
    it('should archive notifications', async () => {
      const notificationIds = ['notif1', 'notif2'];
      mockPrismaService.tx.notification.updateMany.mockResolvedValue({ count: 2 });
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.archiveNotifications(
        'tenant123',
        'user123',
        notificationIds
      );

      expect(result.count).toBe(2);
      expect(mockPrismaService.tx.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds },
          tenantId: 'tenant123',
          userId: 'user123',
        },
        data: {
          archived: true,
          archivedAt: expect.any(Date),
        },
      });
    });
  });

  describe('bulkDeleteNotifications', () => {
    it('should delete multiple notifications', async () => {
      const notificationIds = ['notif1', 'notif2', 'notif3'];
      mockPrismaService.tx.notification.deleteMany.mockResolvedValue({ count: 3 });
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.bulkDeleteNotifications(
        'tenant123',
        'user123',
        notificationIds
      );

      expect(result.count).toBe(3);
      expect(mockPrismaService.tx.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds },
          tenantId: 'tenant123',
          userId: 'user123',
        },
      });
    });
  });

  describe('Service Management', () => {
    it('should create a notification service', async () => {
      const mockService = {
        id: 'service123',
        tenantId: 'tenant123',
        userId: 'user123',
        name: 'Gmail',
        category: 'Work',
        icon: 'Mail',
        color: 'bg-blue-500',
        enabled: true,
        connected: false,
      };

      mockPrismaService.tx.notificationService.create.mockResolvedValue(mockService);

      const result = await service.createService('tenant123', 'user123', {
        name: 'Gmail',
        category: 'Work',
        icon: 'Mail',
        color: 'bg-blue-500',
      });

      expect(result).toEqual(mockService);
      expect(mockPrismaService.tx.notificationService.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant123',
          userId: 'user123',
          name: 'Gmail',
          category: 'Work',
        }),
      });
    });

    it('should update a notification service', async () => {
      mockPrismaService.tx.notificationService.updateMany.mockResolvedValue({ count: 1 });

      await service.updateService('tenant123', 'user123', 'service123', {
        enabled: false,
      });

      expect(mockPrismaService.tx.notificationService.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'service123',
          tenantId: 'tenant123',
          userId: 'user123',
        },
        data: { enabled: false },
      });
    });

    it('should delete a notification service', async () => {
      mockPrismaService.tx.notificationService.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteService('tenant123', 'user123', 'service123');

      expect(mockPrismaService.tx.notificationService.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'service123',
          tenantId: 'tenant123',
          userId: 'user123',
        },
      });
    });
  });

  describe('sendTaskNotification', () => {
    it('should send task assigned notification', async () => {
      const mockNotification = {
        id: 'notif123',
        tenantId: 'tenant123',
        userId: 'user123',
        type: NotificationType.TASK_ASSIGNED,
      };

      mockPrismaService.tx.notification.create.mockResolvedValue(mockNotification);
      mockKafkaService.send.mockResolvedValue(undefined);

      await service.sendTaskNotification(
        'tenant123',
        'user123',
        NotificationType.TASK_ASSIGNED,
        'task123',
        'Complete Feature X'
      );

      expect(mockPrismaService.tx.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned: Complete Feature X',
          message: 'You have been assigned to the task "Complete Feature X"',
          priority: 'medium',
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        }),
      });
    });

    it('should send high priority for overdue tasks', async () => {
      mockPrismaService.tx.notification.create.mockResolvedValue({});
      mockKafkaService.send.mockResolvedValue(undefined);

      await service.sendTaskNotification(
        'tenant123',
        'user123',
        NotificationType.TASK_OVERDUE,
        'task123',
        'Urgent Task'
      );

      expect(mockPrismaService.tx.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 'high',
        }),
      });
    });
  });
});

