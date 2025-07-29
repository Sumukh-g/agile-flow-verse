import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // In a real implementation, validate JWT with Keycloak
    // For now, we'll just check if token exists
    try {
      // Mock JWT validation
      const user = this.validateToken(token);
      request['user'] = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private validateToken(token: string): any {
    // Mock validation - in real app, validate with Keycloak
    return {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    };
  }
} 