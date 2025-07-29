import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Feature, FeatureGuard } from '../feature/feature.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { ProjectService } from './project.service';

@Controller('projects')
@UseGuards(FeatureGuard)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @Feature('wbs_gantt')
  async findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  @Feature('wbs_gantt')
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Post()
  @Feature('wbs_gantt')
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Put(':id')
  @Feature('wbs_gantt')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Feature('wbs_gantt')
  async remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  @Get(':id/tasks')
  @Feature('wbs_gantt')
  async getProjectTasks(@Param('id') id: string) {
    return this.projectService.getProjectTasks(id);
  }
} 