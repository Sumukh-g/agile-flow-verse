import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from '../feature/feature.service';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectService: ProjectService;
  let featureService: FeatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getProjectTasks: jest.fn(),
          },
        },
        {
          provide: FeatureService,
          useValue: {
            hasFeature: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    projectService = module.get<ProjectService>(ProjectService);
    featureService = module.get<FeatureService>(FeatureService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return 404 if wbs_gantt feature is disabled', async () => {
      jest.spyOn(featureService, 'hasFeature').mockResolvedValue(false);

      await expect(controller.findAll()).rejects.toThrow(ForbiddenException);
    });

    it('should return projects if wbs_gantt feature is enabled', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ];

      jest.spyOn(featureService, 'hasFeature').mockResolvedValue(true);
      jest.spyOn(projectService, 'findAll').mockResolvedValue(mockProjects);

      const result = await controller.findAll();
      expect(result).toEqual(mockProjects);
    });
  });
}); 