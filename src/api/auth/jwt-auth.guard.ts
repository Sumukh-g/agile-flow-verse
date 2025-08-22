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
    if (url.startsWith('/v1/health') || url.startsWith('/v1/docs')) {
      return true;
    }

    const authz = req.headers.authorization as string;
    
    // Development mode: Allow requests without auth header for demo users
    if (!authz) {
      // Check if this is a demo request (from our frontend)
      const userAgent = req.headers['user-agent'] || '';
      const isDemoRequest = userAgent.includes('localhost:5173') || 
                           req.headers['x-demo-user'] === 'true' ||
                           req.headers['x-tenant-id'] === 'dev';
      
      if (isDemoRequest) {
        // Create a demo user for development
        (req as any).user = {
          userId: 'demo-user-' + Date.now(),
          tenantId: req.headers['x-tenant-id'] || 'dev',
          roles: ['user'],
          email: 'demo@example.com',
          name: 'Demo User'
        };
        return true;
      }
      
      throw new UnauthorizedException('Missing Authorization header');
    }

    try {
      const decoded = await this.auth.verifyToken(authz);
      (req as any).user = decoded;
      if (!decoded.tenantId) {
        // Allow dev header fallback
        const hTenant = (req.headers['x-tenant-id'] as string) || '';
        (req as any).user.tenantId = hTenant;
      }
      return true;
    } catch (error) {
      // In development, allow demo users even with invalid tokens
      const isDemoRequest = req.headers['x-demo-user'] === 'true' ||
                           req.headers['x-tenant-id'] === 'dev';
      
      if (isDemoRequest) {
        (req as any).user = {
          userId: 'demo-user-' + Date.now(),
          tenantId: req.headers['x-tenant-id'] || 'dev',
          roles: ['user'],
          email: 'demo@example.com',
          name: 'Demo User'
        };
        return true;
      }
      
      throw new UnauthorizedException('Invalid token');
    }
  }
} 