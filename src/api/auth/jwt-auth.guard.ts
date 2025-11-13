import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Public routes
    const url = req.url || '';
    if (
      url.startsWith('/v1/health') || 
      url.startsWith('/v1/docs') || 
      url.startsWith('/v1/auth')
    ) {
      return true;
    }

    const authz = req.headers.authorization as string;
    
    if (!authz) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    try {
      const decoded = await this.auth.verifyToken(authz);
      (req as any).user = decoded;
      
      // Tenant ID must come from the token, not headers
      if (!decoded.tenantId) {
        throw new UnauthorizedException('Token missing tenant information');
      }
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
} 