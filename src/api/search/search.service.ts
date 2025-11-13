import { Injectable, Logger } from '@nestjs/common';
import { RedisClient } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto, SearchResultDto } from './dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisClient,
  ) {}

  async search(tenantId: string, query: SearchQueryDto): Promise<SearchResultDto> {
    const cacheKey = `search:${tenantId}:${JSON.stringify(query)}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const results = await this.performSearch(tenantId, query);
    
    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(results));

    return results;
  }

  async searchNotes(tenantId: string, query: SearchQueryDto) {
    const where: any = {
      tenantId,
    };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const notes = await this.prisma.tx.note.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        attachments: {
          select: { id: true, filename: true, mimeType: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: query.limit || 25,
      skip: query.offset || 0,
    });

    const total = await this.prisma.tx.note.count({ where });

    return {
      notes,
      total,
      hasMore: notes.length === (query.limit || 25),
    };
  }

  async searchTasks(tenantId: string, query: SearchQueryDto) {
    const where: any = {
      tenantId,
    };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const tasks = await this.prisma.tx.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: query.limit || 25,
      skip: query.offset || 0,
    });

    const total = await this.prisma.tx.task.count({ where });

    return {
      tasks,
      total,
      hasMore: tasks.length === (query.limit || 25),
    };
  }

  async searchProjects(tenantId: string, query: SearchQueryDto) {
    const where: any = {
      tenantId,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const projects = await this.prisma.tx.project.findMany({
      where,
      include: {
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: query.limit || 25,
      skip: query.offset || 0,
    });

    const total = await this.prisma.tx.project.count({ where });

    return {
      projects,
      total,
      hasMore: projects.length === (query.limit || 25),
    };
  }

  async searchUsers(tenantId: string, query: SearchQueryDto) {
    const where: any = {
      tenantId,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.tx.user.findMany({
      where,
      include: {
        _count: {
          select: { 
            taskAssignees: true,
            projectMembers: true,
            timesheets: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: query.limit || 25,
      skip: query.offset || 0,
    });

    const total = await this.prisma.tx.user.count({ where });

    return {
      users,
      total,
      hasMore: users.length === (query.limit || 25),
    };
  }

  async getSearchSuggestions(tenantId: string, query: string) {
    const cacheKey = `search:suggestions:${tenantId}:${query}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const suggestions = await this.generateSearchSuggestions(tenantId, query);
    
    // Cache for 10 minutes
    await this.redis.setex(cacheKey, 600, JSON.stringify(suggestions));

    return suggestions;
  }

  async getRecentSearches(tenantId: string, userId: string) {
    const cacheKey = `search:recent:${tenantId}:${userId}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // In a real implementation, you'd store recent searches in the database
    // For now, return empty array
    return [];
  }

  async saveSearchQuery(tenantId: string, userId: string, query: string) {
    const cacheKey = `search:recent:${tenantId}:${userId}`;
    
    // Add to recent searches (in a real implementation, store in database)
    const recent = await this.getRecentSearches(tenantId, userId);
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
    
    await this.redis.setex(cacheKey, 86400, JSON.stringify(updated)); // Cache for 24 hours
  }

  private async performSearch(tenantId: string, query: SearchQueryDto): Promise<SearchResultDto> {
    const results: SearchResultDto = {
      notes: { notes: [], total: 0, hasMore: false },
      tasks: { tasks: [], total: 0, hasMore: false },
      projects: { projects: [], total: 0, hasMore: false },
      users: { users: [], total: 0, hasMore: false },
    };

    // Search different entity types based on query type
    if (!query.type || query.type === 'all' || query.type === 'notes') {
      results.notes = await this.searchNotes(tenantId, query);
    }

    if (!query.type || query.type === 'all' || query.type === 'tasks') {
      results.tasks = await this.searchTasks(tenantId, query);
    }

    if (!query.type || query.type === 'all' || query.type === 'projects') {
      results.projects = await this.searchProjects(tenantId, query);
    }

    if (!query.type || query.type === 'all' || query.type === 'users') {
      results.users = await this.searchUsers(tenantId, query);
    }

    return results;
  }

  private async generateSearchSuggestions(tenantId: string, query: string) {
    const suggestions = [];

    // Get recent project names
    const recentProjects = await this.prisma.tx.project.findMany({
      where: {
        tenantId,
        name: { contains: query, mode: 'insensitive' },
      },
      select: { name: true },
      take: 5,
    });

    suggestions.push(...recentProjects.map(p => ({ type: 'project', text: p.name })));

    // Get recent task titles
    const recentTasks = await this.prisma.tx.task.findMany({
      where: {
        tenantId,
        title: { contains: query, mode: 'insensitive' },
      },
      select: { title: true },
      take: 5,
    });

    suggestions.push(...recentTasks.map(t => ({ type: 'task', text: t.title })));

    // Get recent note titles
    const recentNotes = await this.prisma.tx.note.findMany({
      where: {
        tenantId,
        title: { contains: query, mode: 'insensitive' },
      },
      select: { title: true },
      take: 5,
    });

    suggestions.push(...recentNotes.map(n => ({ type: 'note', text: n.title })));

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }
}





