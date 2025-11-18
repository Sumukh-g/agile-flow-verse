import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import jwt, { JwtHeader } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto } from './dto';

export type DecodedUser = {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  email?: string;
  name?: string;
  sessionId?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const JWKS_URI = process.env.KEYCLOAK_JWKS_URI || 'http://localhost:8080/realms/master/protocol/openid-connect/certs';
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_CLIENT_ID || 'agile-flow-verse';
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/master';

const jwksClient = jwksRsa({ jwksUri: JWKS_URI });

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private async getKey(header: JwtHeader): Promise<string> {
    const key = await jwksClient.getSigningKey(header.kid as string);
    return key.getPublicKey();
  }

  async verifyToken(bearer: string): Promise<DecodedUser> {
    const token = bearer.replace(/^Bearer\s+/i, '');
    
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      this.logger.error('[AUTH ERROR] JWT_SECRET is not configured. Cannot verify tokens.');
      throw new UnauthorizedException('Authentication service misconfigured: JWT_SECRET missing');
    }
    
    console.log('[AUTH DEBUG] Verifying token, length:', token.length);
    console.log('[AUTH DEBUG] JWT_SECRET set:', !!process.env.JWT_SECRET);
    console.log('[AUTH DEBUG] Token preview:', token.substring(0, 50) + '...');
    
    // Try local JWT verification first (HS256 with JWT_SECRET)
    try {
      const decoded = this.jwtService.verify(token) as any;
      console.log('[AUTH DEBUG] Local JWT verification SUCCESS');
      console.log('[AUTH DEBUG] Decoded payload:', JSON.stringify({ sub: decoded.sub, tenantId: decoded.tenantId, email: decoded.email }));
      
      // Local tokens have tenantId directly in payload
      const userId = decoded.sub || decoded.userId;
      const tenantId = decoded.tenantId || '';
      const roles = decoded.roles || [];
      
      if (!userId) {
        console.error('[AUTH DEBUG] REJECTED: No userId in token');
        throw new UnauthorizedException('Token missing userId');
      }
      
      if (!tenantId) {
        console.error('[AUTH DEBUG] REJECTED: No tenantId in token');
        throw new UnauthorizedException('Token missing tenantId');
      }

      // Get user permissions from database
      const userPermissions = await this.getUserPermissions(userId, tenantId);
      console.log('[AUTH DEBUG] User permissions loaded:', userPermissions.length);

      return {
        userId,
        tenantId,
        roles,
        permissions: userPermissions,
        email: decoded.email,
        name: decoded.name,
      };
    } catch (localError) {
      const errorMessage = (localError as Error).message;
      console.error('[AUTH DEBUG] Local JWT verification FAILED:', errorMessage);
      
      // Provide more specific error messages
      if (errorMessage.includes('secret') || errorMessage.includes('signature')) {
        this.logger.error('[AUTH ERROR] Token signature verification failed. JWT_SECRET may be incorrect.');
        throw new UnauthorizedException('Invalid token signature');
      }
      if (errorMessage.includes('expired')) {
        throw new UnauthorizedException('Token expired');
      }
      if (errorMessage.includes('malformed') || errorMessage.includes('invalid')) {
        throw new UnauthorizedException('Invalid token format');
      }
      
      // Skip Keycloak if disabled
      const enableKeycloak = process.env.ENABLE_KEYCLOAK === 'true';
      if (!enableKeycloak) {
        console.error('[AUTH DEBUG] Keycloak disabled, rejecting token');
        throw new UnauthorizedException(`Invalid token: ${errorMessage}`);
      }
      
      // If local verification fails, try Keycloak (RS256 with JWKS)
      try {
        console.log('[AUTH DEBUG] Trying Keycloak verification...');
        const decoded: any = await new Promise((resolve, reject) => {
          jwt.verify(
            token,
            async (header, cb) => {
              try {
                const key = await this.getKey(header as JwtHeader);
                cb(null, key);
              } catch (err) {
                cb(err as Error, null);
              }
            },
            {
              audience: KEYCLOAK_AUDIENCE,
              issuer: KEYCLOAK_ISSUER,
              algorithms: ['RS256'],
            },
            (err, payload) => (err ? reject(err) : resolve(payload)),
          );
        });

        console.log('[AUTH DEBUG] Keycloak verification SUCCESS');
        // Map Keycloak claims -> app identity
        const userId = decoded.sub as string;
        const tenantId = (decoded['tenant_id'] as string) || (decoded['orgId'] as string) || '';
        const rolesClaim = (decoded['realm_access']?.roles || []) as string[];

        // Get user permissions from database
        const userPermissions = await this.getUserPermissions(userId, tenantId);

        return {
          userId,
          tenantId,
          roles: rolesClaim,
          permissions: userPermissions,
          email: decoded.email,
          name: decoded.name,
        };
      } catch (keycloakError) {
        console.error('[AUTH DEBUG] Keycloak verification FAILED:', (keycloakError as Error).message);
        throw new UnauthorizedException('Invalid token');
      }
    }
  }

  async generateTokens(user: DecodedUser): Promise<AuthTokens> {
    // Validate required fields
    if (!user.userId) {
      throw new Error('Cannot generate token: userId is required');
    }
    if (!user.tenantId) {
      throw new Error('Cannot generate token: tenantId is required');
    }

    const payload = {
      sub: user.userId,
      tenantId: user.tenantId,
      roles: user.roles || [],
      permissions: user.permissions || [],
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { sub: user.userId, tenantId: user.tenantId },
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    await this.storeRefreshToken(user.userId, user.tenantId, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ user: { id: string; name: string; email: string; tenantId: string }; accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.getUserById(decoded.sub, decoded.tenantId);
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      return {
        user: {
          id: user.userId,
          name: user.name || '',
          email: user.email || '',
          tenantId: user.tenantId,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async hasPermission(userId: string, tenantId: string, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    return userPermissions.includes(permission) || userPermissions.includes('*');
  }

  async hasRole(userId: string, tenantId: string, role: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId, tenantId);
    return userRoles.includes(role);
  }

  private async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const roleAssignments = await this.prisma.roleAssignment.findMany({
      where: { userId, tenantId },
      include: { role: true },
    });

    const permissions = new Set<string>();
    roleAssignments.forEach(assignment => {
      assignment.role.permissions.forEach(permission => {
        permissions.add(permission);
      });
    });

    return Array.from(permissions);
  }

  private async getUserRoles(userId: string, tenantId: string): Promise<string[]> {
    const roleAssignments = await this.prisma.roleAssignment.findMany({
      where: { userId, tenantId },
      include: { role: true },
    });

    return roleAssignments.map(assignment => assignment.role.name);
  }

  private async getUserById(userId: string, tenantId: string): Promise<DecodedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) return null;

    const permissions = await this.getUserPermissions(userId, tenantId);
    const roles = await this.getUserRoles(userId, tenantId);

    return {
      userId: user.id,
      tenantId: user.tenantId,
      roles,
      permissions,
      email: user.email,
      name: user.name,
    };
  }

  private async storeRefreshToken(userId: string, tenantId: string, token: string): Promise<void> {
    const hashedToken = await bcrypt.hash(token, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tenantId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  async signup(dto: SignupDto): Promise<AuthTokens & { user: any }> {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Get or create default tenant
    let tenant = await this.prisma.tenant.findFirst({
      where: { slug: 'default' }
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          slug: 'default',
          sku: 'basic'
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        tenantId: tenant.id,
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      roles: ['user'],
      permissions: [],
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: any }> {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      this.logger.error('[AUTH ERROR] JWT_SECRET is not configured. Cannot generate tokens.');
      throw new UnauthorizedException('Authentication service misconfigured: JWT_SECRET missing');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user || !user.password) {
      this.logger.warn(`[AUTH] Login attempt failed: User not found or no password set for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn(`[AUTH] Login attempt failed: Invalid password for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure user has tenantId
    if (!user.tenantId) {
      this.logger.error(`[AUTH ERROR] User ${user.id} has no tenantId. Cannot generate token.`);
      throw new UnauthorizedException('User account misconfigured: missing tenant information');
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      roles: ['user'],
      permissions: [],
      email: user.email,
      name: user.name,
    });

    this.logger.log(`[AUTH] User ${user.email} logged in successfully`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      },
      ...tokens,
    };
  }
} 