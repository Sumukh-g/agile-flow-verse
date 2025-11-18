"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const redis_client_1 = require("../common/redis/redis.client");
const prisma_service_1 = require("../prisma/prisma.service");
let SearchService = SearchService_1 = class SearchService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(SearchService_1.name);
    }
    async search(tenantId, query) {
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
    async searchNotes(tenantId, query) {
        const where = {
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
    async searchTasks(tenantId, query) {
        const where = {
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
    async searchProjects(tenantId, query) {
        const where = {
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
    async searchUsers(tenantId, query) {
        const where = {
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
    async getSearchSuggestions(tenantId, query) {
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
    async getRecentSearches(tenantId, userId) {
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
    async saveSearchQuery(tenantId, userId, query) {
        const cacheKey = `search:recent:${tenantId}:${userId}`;
        // Add to recent searches (in a real implementation, store in database)
        const recent = await this.getRecentSearches(tenantId, userId);
        const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
        await this.redis.setex(cacheKey, 86400, JSON.stringify(updated)); // Cache for 24 hours
    }
    async performSearch(tenantId, query) {
        const results = {
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
    async generateSearchSuggestions(tenantId, query) {
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
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_client_1.RedisClient])
], SearchService);
