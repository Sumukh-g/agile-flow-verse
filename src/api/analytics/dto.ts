import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum AnalyticsTimeRange {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_YEAR = '1y',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Time range for analytics', 
    enum: AnalyticsTimeRange,
    example: AnalyticsTimeRange.LAST_30_DAYS
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeRange)
  timeRange?: AnalyticsTimeRange;

  @ApiPropertyOptional({ description: 'Start date for custom range', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for custom range', example: '2024-01-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class ProjectAnalyticsDto {
  @ApiProperty({ description: 'Project information' })
  project: {
    id: string;
    name: string;
    status: string;
    progress: number;
    budget?: number;
    spent: number;
    startDate?: Date;
    endDate?: Date;
    memberCount: number;
  };

  @ApiProperty({ description: 'Task statistics' })
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    completed: number;
    inProgress: number;
    todo: number;
  };

  @ApiProperty({ description: 'Time tracking statistics' })
  timeTracking: {
    totalHours: number;
    averageHoursPerEntry: number;
  };

  @ApiProperty({ description: 'Progress over time data' })
  progressOverTime: {
    timeline: any[];
    milestones: any[];
  };
}

export class TaskAnalyticsDto {
  @ApiProperty({ description: 'Total number of tasks' })
  total: number;

  @ApiProperty({ description: 'Tasks grouped by status' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: 'Task completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average completion time in days' })
  averageCompletionTimeDays: number;

  @ApiProperty({ description: 'Number of overdue tasks' })
  overdueTasks: number;

  @ApiProperty({ description: 'Task velocity metrics' })
  velocity: {
    tasksPerWeek: number;
    totalCompleted: number;
  };
}

export class UserAnalyticsDto {
  @ApiProperty({ description: 'Number of assigned tasks' })
  assignedTasks: number;

  @ApiProperty({ description: 'Number of completed tasks' })
  completedTasks: number;

  @ApiProperty({ description: 'Task completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Total hours logged' })
  totalHoursLogged: number;

  @ApiProperty({ description: 'Average hours per day' })
  averageHoursPerDay: number;

  @ApiProperty({ description: 'Tasks grouped by status' })
  tasksByStatus: Record<string, number>;
}

export class TenantAnalyticsDto {
  @ApiProperty({ description: 'Tenant overview statistics' })
  overview: {
    projects: number;
    activeProjects: number;
    tasks: number;
    users: number;
    completionRate: number;
  };

  @ApiProperty({ description: 'Task statistics' })
  tasks: {
    total: number;
    completed: number;
    byStatus: Record<string, number>;
  };
}





