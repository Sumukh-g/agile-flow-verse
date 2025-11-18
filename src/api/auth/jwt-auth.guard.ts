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
      console.log('[GUARD DEBUG] Public route allowed:', url);
      return true;
    }

    const authz = req.headers.authorization as string;
    
    console.log('[GUARD DEBUG] Protected route:', url);
    console.log('[GUARD DEBUG] Authorization header present:', !!authz);
    
    if (!authz) {
      console.error('[GUARD DEBUG] REJECTED: No Authorization header');
      throw new UnauthorizedException('Missing Authorization header');
    }

    try {
      const decoded = await this.auth.verifyToken(authz);
      (req as any).user = decoded;
      
      console.log('[GUARD DEBUG] Token verified, user:', decoded.userId, 'tenant:', decoded.tenantId);
      
      // Tenant ID must come from the token, not headers
      if (!decoded.tenantId) {
        console.error('[GUARD DEBUG] REJECTED: No tenantId in decoded token');
        throw new UnauthorizedException('Token missing tenant information');
      }
      
      console.log('[GUARD DEBUG] Request ALLOWED');
      return true;
    } catch (error) {
      console.error('[GUARD DEBUG] REJECTED: Token verification failed:', (error as Error).message);
      throw error; // Re-throw the original error with specific message
    }
  }
} 