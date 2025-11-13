import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export enum SearchType {
  ALL = 'all',
  NOTES = 'notes',
  TASKS = 'tasks',
  PROJECTS = 'projects',
  USERS = 'users',
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string', example: 'authentication' })
  @IsString()
  search: string;

  @ApiPropertyOptional({ 
    description: 'Type of entities to search', 
    enum: SearchType,
    example: SearchType.ALL
  })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by priority' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Number of items to skip', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Note search results' })
  notes: {
    notes: any[];
    total: number;
    hasMore: boolean;
  };

  @ApiProperty({ description: 'Task search results' })
  tasks: {
    tasks: any[];
    total: number;
    hasMore: boolean;
  };

  @ApiProperty({ description: 'Project search results' })
  projects: {
    projects: any[];
    total: number;
    hasMore: boolean;
  };

  @ApiProperty({ description: 'User search results' })
  users: {
    users: any[];
    total: number;
    hasMore: boolean;
  };
}

export class SearchSuggestionDto {
  @ApiProperty({ description: 'Suggestion type', example: 'project' })
  type: string;

  @ApiProperty({ description: 'Suggestion text', example: 'Website Redesign' })
  text: string;
}





