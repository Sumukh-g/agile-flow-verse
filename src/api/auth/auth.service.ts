import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
    
    // Try local JWT verification first (HS256 with JWT_SECRET)
    try {
      const decoded = this.jwtService.verify(token) as any;
      
      // Local tokens have tenantId directly in payload
      const userId = decoded.sub || decoded.userId;
      const tenantId = decoded.tenantId || '';
      const roles = decoded.roles || [];
      
      if (!userId || !tenantId) {
        throw new UnauthorizedException('Token missing required fields');
      }

      // Get user permissions from database
      const userPermissions = await this.getUserPermissions(userId, tenantId);

      return {
        userId,
        tenantId,
        roles,
        permissions: userPermissions,
        email: decoded.email,
        name: decoded.name,
      };
    } catch (localError) {
      // If local verification fails, try Keycloak (RS256 with JWKS)
      try {
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
        throw new UnauthorizedException('Invalid token');
      }
    }
  }

  async generateTokens(user: DecodedUser): Promise<AuthTokens> {
    const payload = {
      sub: user.userId,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
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
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
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