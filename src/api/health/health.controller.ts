import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('/v1/health')
export class HealthController {
  @Get()
  ok() {
    return { ok: true, ts: new Date().toISOString() };
  }
} 