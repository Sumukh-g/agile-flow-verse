import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        creator: true,
        tasks: true,
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        creator: true,
        tasks: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto) {
    // In a real app, get user from request context
    const userId = 'user-123'; // Mock user ID

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        createdBy: userId,
        startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : null,
        endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : null,
      },
      include: {
        creator: true,
      },
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        startDate: updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : undefined,
        endDate: updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : undefined,
      },
      include: {
        creator: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getProjectTasks(id: string) {
    await this.findOne(id);

    return this.prisma.task.findMany({
      where: { projectId: id },
      include: {
        assignee: true,
      },
    });
  }
} 