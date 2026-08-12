import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeaturesService } from './features.service';

@ApiTags('features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get tenant feature entitlements',
    description:
      'Returns the effective feature flags for the current tenant, merging the global catalog with tenant overrides.',
  })
  @ApiResponse({ status: 200, description: 'Features retrieved successfully' })
  async getFeatures(@Request() req: any) {
    return this.featuresService.getTenantFeatures(req.user.tenantId);
  }
}
