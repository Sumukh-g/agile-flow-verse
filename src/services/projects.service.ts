/**
 * Projects Service
 * Handles all project-related operations
 */

import { QueryClient } from '@tanstack/react-query';
import { BaseService } from './base.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  Project,
  PaginatedResponse,
} from '@/shared/types';

// Query keys factory for projects
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (query?: ProjectQueryDto) => [...projectKeys.lists(), query] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export class ProjectsService extends BaseService {
  protected readonly basePath = '/projects';

  constructor(protected readonly queryClient: QueryClient) {
    super();
  }

  /**
   * Get projects with query filters
   */
  async getProjects(query?: ProjectQueryDto): Promise<Project[]> {
    const response = await this.get<PaginatedResponse<Project>>(this.basePath, {
      params: query,
    });
    return this.transformResponse(response.items);
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project> {
    return this.get<Project>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    const transformedData = this.transformRequest(data);
    const project = await this.post<Project>(this.basePath, transformedData);

    // Invalidate cache
    this.invalidateCache({
      invalidateQueries: [projectKeys.all, projectKeys.lists()],
    });

    return project;
  }

  /**
   * Update a project
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    const transformedData = this.transformRequest(data);
    const project = await this.put<Project>(`${this.basePath}/${id}`, transformedData);

    // Invalidate cache
    this.invalidateCache({
      invalidateQueries: [
        projectKeys.all,
        projectKeys.lists(),
        projectKeys.detail(id),
        projectKeys.details(),
      ],
    });

    return project;
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await this.delete(`${this.basePath}/${id}`);

    // Invalidate cache
    this.invalidateCache({
      invalidateQueries: [
        projectKeys.all,
        projectKeys.lists(),
        projectKeys.details(),
      ],
    });
  }
}

