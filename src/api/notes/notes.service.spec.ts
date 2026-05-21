import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectPermissionsService } from '../common/project-permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NoteScopeDto } from './dto';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  let service: NotesService;
  let prisma: jest.Mocked<PrismaService>;
  let permissions: jest.Mocked<ProjectPermissionsService>;

  const mockPrisma = {
    tx: {
      note: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      calendarEvent: {
        create: jest.fn(),
      },
    },
  };

  const mockPermissions = {
    ensureCanReadProject: jest.fn(),
    ensureCanWriteProject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProjectPermissionsService,
          useValue: mockPermissions,
        },
      ],
    }).compile();

    service = module.get(NotesService);
    prisma = module.get(PrismaService);
    permissions = module.get(ProjectPermissionsService);
    jest.resetAllMocks();
  });

  describe('create', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    it('creates personal note without projectId', async () => {
      const dto = {
        title: 'Personal',
        content: '{"type":"doc"}',
      };
      prisma.tx.note.create.mockResolvedValue({ id: 'note-1' } as any);

      await service.create(tenantId, userId, dto);

      expect(permissions.ensureCanReadProject).not.toHaveBeenCalled();
      expect(permissions.ensureCanWriteProject).not.toHaveBeenCalled();
      expect(prisma.tx.note.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          title: dto.title,
          scope: NoteScopeDto.PERSONAL,
          projectId: null,
          createdById: userId,
          updatedById: userId,
        }),
      });
    });

    it('creates project note when projectId provided', async () => {
      const dto = {
        title: 'Project note',
        content: '{"type":"doc"}',
        projectId: 'proj-1',
      };
      prisma.tx.note.create.mockResolvedValue({ id: 'note-1' } as any);

      await service.create(tenantId, userId, dto);

      expect(permissions.ensureCanWriteProject).toHaveBeenCalledWith(tenantId, userId, dto.projectId);
      expect(prisma.tx.note.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scope: NoteScopeDto.PROJECT,
          projectId: dto.projectId,
        }),
      });
    });

    it('rejects PROJECT scope without projectId', async () => {
      await expect(
        service.create(tenantId, userId, {
          title: 'Bad',
          content: '{"type":"doc"}',
          scope: NoteScopeDto.PROJECT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ignores spoofed creator identity from client payload', async () => {
      prisma.tx.note.create.mockResolvedValue({ id: 'note-1' } as any);

      await service.create(tenantId, userId, {
        title: 'Spoof',
        content: '{"type":"doc"}',
        ...( { createdById: 'attacker', tenantId: 'other-tenant' } as any ),
      });

      expect(prisma.tx.note.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          createdById: userId,
        }),
      });
    });
  });

  describe('list', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    it('lists only current user personal notes when scope=personal', async () => {
      prisma.tx.note.findMany.mockResolvedValue([] as any);

      await service.list(tenantId, userId, { scope: NoteScopeDto.PERSONAL });

      expect(prisma.tx.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            scope: NoteScopeDto.PERSONAL,
            createdById: userId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('defaults GET /notes to personal scoped listing (no tenant-wide leak)', async () => {
      prisma.tx.note.findMany.mockResolvedValue([] as any);

      await service.list(tenantId, userId, {});

      expect(prisma.tx.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            scope: NoteScopeDto.PERSONAL,
            createdById: userId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('lists project notes after project read permission check', async () => {
      prisma.tx.note.findMany.mockResolvedValue([] as any);
      const projectId = 'proj-1';

      await service.list(tenantId, userId, { projectId });

      expect(permissions.ensureCanReadProject).toHaveBeenCalledWith(tenantId, userId, projectId);
      expect(prisma.tx.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            scope: NoteScopeDto.PROJECT,
            projectId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('rejects project scope list without projectId', async () => {
      await expect(
        service.list(tenantId, userId, { scope: NoteScopeDto.PROJECT }),
      ).rejects.toThrow(BadRequestException);
    });

    it('denies project list for non-member', async () => {
      permissions.ensureCanReadProject.mockRejectedValue(new ForbiddenException('Not authorized'));

      await expect(
        service.list(tenantId, userId, { projectId: 'proj-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects invalid scope value and never queries broad tenant notes', async () => {
      await expect(
        service.list(tenantId, userId, { scope: 'foo' as any }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.tx.note.findMany).not.toHaveBeenCalled();
    });

    it('personal listing query excludes project-scoped notes by where filter', async () => {
      prisma.tx.note.findMany.mockResolvedValue([] as any);

      await service.list(tenantId, userId, { scope: NoteScopeDto.PERSONAL });

      const whereArg = (prisma.tx.note.findMany as jest.Mock).mock.calls[0][0].where;
      expect(whereArg.scope).toBe(NoteScopeDto.PERSONAL);
      expect(whereArg.projectId).toBeUndefined();
      expect(whereArg.createdById).toBe(userId);
    });

    it('project listing query excludes personal notes by where filter', async () => {
      prisma.tx.note.findMany.mockResolvedValue([] as any);

      await service.list(tenantId, userId, { projectId: 'proj-1' });

      const whereArg = (prisma.tx.note.findMany as jest.Mock).mock.calls[0][0].where;
      expect(whereArg.scope).toBe(NoteScopeDto.PROJECT);
      expect(whereArg.projectId).toBe('proj-1');
      expect(whereArg.createdById).toBeUndefined();
    });

    it('normalizes lowercase scope values safely', async () => {
      prisma.tx.note.findMany.mockResolvedValue([] as any);

      await service.list(tenantId, userId, { scope: 'personal' as any });

      expect(prisma.tx.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scope: NoteScopeDto.PERSONAL,
            createdById: userId,
          }),
        }),
      );
    });
  });

  describe('get/update/delete authorization', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    it('allows owner to read personal note', async () => {
      prisma.tx.note.findFirst.mockResolvedValue({
        id: 'note-1',
        tenantId,
        scope: NoteScopeDto.PERSONAL,
        createdById: userId,
      } as any);

      const result = await service.get(tenantId, userId, 'note-1');
      expect(result.id).toBe('note-1');
    });

    it('blocks reading another user personal note in same tenant', async () => {
      prisma.tx.note.findFirst.mockResolvedValue({
        id: 'note-1',
        tenantId,
        scope: NoteScopeDto.PERSONAL,
        createdById: 'user-2',
      } as any);

      await expect(service.get(tenantId, userId, 'note-1')).rejects.toThrow(ForbiddenException);
    });

    it('enforces project permission on project note get', async () => {
      prisma.tx.note.findFirst.mockResolvedValue({
        id: 'note-1',
        tenantId,
        scope: NoteScopeDto.PROJECT,
        projectId: 'proj-1',
      } as any);

      await service.get(tenantId, userId, 'note-1');

      expect(permissions.ensureCanReadProject).toHaveBeenCalledWith(tenantId, userId, 'proj-1');
    });

    it('updates personal note only for owner', async () => {
      prisma.tx.note.findFirst.mockResolvedValue({
        id: 'note-1',
        tenantId,
        scope: NoteScopeDto.PERSONAL,
        createdById: userId,
      } as any);
      prisma.tx.note.update.mockResolvedValue({ id: 'note-1' } as any);

      await service.update(tenantId, userId, 'note-1', { title: 'Updated' });

      expect(prisma.tx.note.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: expect.objectContaining({
          title: 'Updated',
          updatedById: userId,
        }),
      });
    });

    it('blocks updating personal note for non-owner', async () => {
      prisma.tx.note.findFirst.mockResolvedValue({
        id: 'note-1',
        tenantId,
        scope: NoteScopeDto.PERSONAL,
        createdById: 'user-2',
      } as any);

      await expect(
        service.update(tenantId, userId, 'note-1', { title: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('soft deletes note and excludes soft-deleted by default query filter', async () => {
      prisma.tx.note.findFirst.mockResolvedValue({
        id: 'note-1',
        tenantId,
        scope: NoteScopeDto.PERSONAL,
        createdById: userId,
      } as any);
      prisma.tx.note.update.mockResolvedValue({ id: 'note-1' } as any);

      await service.delete(tenantId, userId, 'note-1');

      expect(prisma.tx.note.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedById: userId,
        }),
      });
    });

    it('throws not found for missing note', async () => {
      prisma.tx.note.findFirst.mockResolvedValue(null);
      await expect(service.get(tenantId, userId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
