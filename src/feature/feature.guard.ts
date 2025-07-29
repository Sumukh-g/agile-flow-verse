import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureService } from './feature.service';

export const Feature = (featureKey: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('feature', featureKey, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureService: FeatureService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.get<string>('feature', context.getHandler());
    
    if (!featureKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    const hasFeature = await this.featureService.hasFeature(tenantId, featureKey);
    
    if (!hasFeature) {
      throw new ForbiddenException(`Feature ${featureKey} is not enabled for this tenant`);
    }

    return true;
  }
} 