import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TestService } from './test.service';

@ApiTags('testing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('database')
  @ApiOperation({ summary: 'Run database tests' })
  @ApiResponse({ status: 200, description: 'Database tests completed' })
  async runDatabaseTests() {
    return this.testService.runDatabaseTests();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Run Redis tests' })
  @ApiResponse({ status: 200, description: 'Redis tests completed' })
  async runRedisTests() {
    return this.testService.runRedisTests();
  }

  @Get('performance')
  @ApiOperation({ summary: 'Run performance tests' })
  @ApiResponse({ status: 200, description: 'Performance tests completed' })
  async runPerformanceTests() {
    return this.testService.runPerformanceTests();
  }

  @Get('integration')
  @ApiOperation({ summary: 'Run integration tests' })
  @ApiResponse({ status: 200, description: 'Integration tests completed' })
  async runIntegrationTests() {
    return this.testService.runIntegrationTests();
  }

  @Post('load')
  @ApiOperation({ summary: 'Run load tests' })
  @ApiResponse({ status: 200, description: 'Load tests completed' })
  async runLoadTests(
    @Query('concurrency') concurrency?: number,
    @Query('iterations') iterations?: number,
  ) {
    return this.testService.runLoadTests(concurrency || 10, iterations || 100);
  }

  @Get('all')
  @ApiOperation({ summary: 'Run all tests' })
  @ApiResponse({ status: 200, description: 'All tests completed' })
  async runAllTests() {
    const [database, redis, performance, integration, load] = await Promise.all([
      this.testService.runDatabaseTests(),
      this.testService.runRedisTests(),
      this.testService.runPerformanceTests(),
      this.testService.runIntegrationTests(),
      this.testService.runLoadTests(5, 50),
    ]);

    return {
      database,
      redis,
      performance,
      integration,
      load,
      timestamp: new Date().toISOString(),
    };
  }
}





