import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { getRedis } from '../common/redis/redis.client';

@ApiTags('health')
@Controller('/v1/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  ok() {
    return { ok: true, ts: new Date().toISOString() };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async detailed() {
    const [dbHealth, redisHealth] = await Promise.allSettled([
      this.prisma.healthCheck(),
      this.checkRedis(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.status === 'fulfilled' ? dbHealth.value : { status: 'unhealthy' },
        redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'unhealthy' },
      },
    };
  }

  private async checkRedis(): Promise<{ status: string; latency?: number }> {
    try {
      const redis = getRedis();
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
} 