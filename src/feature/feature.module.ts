import { Module } from '@nestjs/common';
import { FeatureGuard } from './feature.guard';
import { FeatureService } from './feature.service';

@Module({
  providers: [FeatureService, FeatureGuard],
  exports: [FeatureService, FeatureGuard],
})
export class FeatureModule {} 