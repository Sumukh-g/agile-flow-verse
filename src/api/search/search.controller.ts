import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchQueryDto } from './dto';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across all entities' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(@Query() query: SearchQueryDto, @Request() req: any) {
    // Save search query for recent searches
    if (query.search) {
      await this.searchService.saveSearchQuery(req.user.tenantId, req.user.userId, query.search);
    }

    return this.searchService.search(req.user.tenantId, query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions retrieved successfully' })
  async getSuggestions(@Query('q') query: string, @Request() req: any) {
    return this.searchService.getSearchSuggestions(req.user.tenantId, query);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent searches' })
  @ApiResponse({ status: 200, description: 'Recent searches retrieved successfully' })
  async getRecentSearches(@Request() req: any) {
    return this.searchService.getRecentSearches(req.user.tenantId, req.user.userId);
  }
}





