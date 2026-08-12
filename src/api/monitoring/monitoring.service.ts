import { Injectable, Logger } from '@nestjs/common';
import { getRedis } from '../common/redis/redis.client';
import { PrismaService } from '../prisma/prisma.service';
import { errorTracker } from '../common/observability/error-tracker';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    // Add more services as needed
  };
  metrics: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<SystemHealth> {
    const [databaseHealth, redisHealth] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const services = {
      database:
        databaseHealth.status === 'fulfilled'
          ? databaseHealth.value
          : { status: 'unhealthy' as const, error: databaseHealth.reason?.message },
      redis:
        redisHealth.status === 'fulfilled'
          ? redisHealth.value
          : { status: 'unhealthy' as const, error: redisHealth.reason?.message },
    };

    const overallStatus = this.determineOverallStatus(services);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      metrics: {
        uptime: Date.now() - this.startTime,
        memory: process.memoryUsage(),
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error: any) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    try {
      const redis = getRedis();
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error: any) {
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private determineOverallStatus(services: SystemHealth['services']): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = Object.values(services).filter((s) => s.status === 'unhealthy').length;
    const totalServices = Object.keys(services).length;

    if (unhealthyCount === 0) {
      return 'healthy';
    } else if (unhealthyCount < totalServices) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  async getMetrics() {
    return {
      uptime: Date.now() - this.startTime,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
    };
  }

  async getSystemMetrics() {
    return this.getMetrics();
  }

  async getTenantMetrics(tenantId: string) {
    // Get tenant-specific metrics
    try {
      const [projectCount, taskCount, userCount] = await Promise.all([
        this.prisma.project.count({ where: { tenantId } }),
        this.prisma.task.count({ where: { tenantId } }),
        this.prisma.user.count({ where: { tenantId } }),
      ]);

      return {
        tenantId,
        projects: projectCount,
        tasks: taskCount,
        users: userCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get tenant metrics for ${tenantId}:`, error);
      throw error;
    }
  }

  async getPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    return {
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      cpu: process.cpuUsage(),
      uptime: Date.now() - this.startTime,
      eventLoopDelay: 0, // Would need perf_hooks for this
    };
  }

  async getErrorMetrics() {
    // Backed by the in-process ErrorTracker (recent 5xx errors + per-type counts).
    return errorTracker.getMetrics();
  }

  async getHealthStatus() {
    return this.getHealth();
  }

  async getAuditLogs(tenantId: string, limit = 100) {
    try {
      return await this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 1000),
      });
    } catch (error) {
      this.logger.error(`Failed to get audit logs for ${tenantId}:`, error);
      throw error;
    }
  }
}



