import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import jwt, { JwtHeader } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto } from './dto';

// OAuth Response Types
interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

interface MicrosoftUserInfo {
  id: string;
  mail?: string;
  userPrincipalName?: string;
  displayName?: string;
}

interface GitHubUserInfo {
  id: number;
  email?: string;
  name?: string;
  login: string;
}

interface AppleUserInfo {
  sub: string;
  email?: string;
  name?: string;
}

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
    
    // Try local JWT verification first (HS256 with JWT_SECRET)
    try {
      const decoded = this.jwtService.verify(token) as any;
      
      const userId = decoded.sub || decoded.userId;
      const tenantId = decoded.tenantId || '';
      const roles = decoded.roles || [];
      
      if (!userId) {
        throw new UnauthorizedException('Token missing userId');
      }
      
      if (!tenantId) {
        throw new UnauthorizedException('Token missing tenantId');
      }

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
      const errorMessage = (localError as Error).message;
      
      if (errorMessage.includes('secret') || errorMessage.includes('signature')) {
        throw new UnauthorizedException('Invalid token signature');
      }
      if (errorMessage.includes('expired')) {
        throw new UnauthorizedException('Token expired');
      }
      if (errorMessage.includes('malformed') || errorMessage.includes('invalid')) {
        throw new UnauthorizedException('Invalid token format');
      }
      
      const enableKeycloak = process.env.ENABLE_KEYCLOAK === 'true';
      if (!enableKeycloak) {
        throw new UnauthorizedException(`Invalid token: ${errorMessage}`);
      }
      
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

      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: { token: tokenHash, userId: decoded.sub },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (storedToken.expiresAt && storedToken.expiresAt < new Date()) {
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = await this.getUserById(decoded.sub, decoded.tenantId);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

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
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({
      where: { token: tokenHash },
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(userId: string, tenantId: string, token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tenantId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

    /**
     * Create a UNIQUE tenant for each new user
     * This ensures proper data isolation - each user gets their own tenant
     * and won't see data from other users.
     * 
     * Previously, all users were assigned to a shared "default" tenant,
     * which caused data leakage between users.
     */
    // Generate a unique tenant slug from email (before @) or use tenantName if provided
    const tenantName = dto.tenantName || `${dto.name}'s Workspace`;
    const baseSlug = dto.tenantName 
      ? dto.tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : dto.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Ensure slug is unique by appending a timestamp if needed
    let tenantSlug = baseSlug;
    let slugExists = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    let counter = 1;
    while (slugExists) {
      tenantSlug = `${baseSlug}-${Date.now()}-${counter}`;
      slugExists = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      counter++;
    }

    // Create a new tenant for this user
    const tenant = await this.prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        sku: 'basic'
      }
    });

    this.logger.log(`Created new tenant for user ${dto.email}: ${tenant.name} (${tenant.id})`);

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

  /**
   * User Login
   * 
   * Authenticates a user with email and password.
   * If 2FA is enabled, returns a flag indicating 2FA verification is required.
   * 
   * @param dto - Login credentials (email and password)
   * @returns AuthTokens with user data, or requiresTwoFactor flag if 2FA is enabled
   */
  async login(dto: LoginDto): Promise<AuthTokens & { user: any; requiresTwoFactor?: boolean }> {
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

    // Check if 2FA is enabled
    if (user.totpEnabled) {
      this.logger.log(`[AUTH] User ${user.email} has 2FA enabled, requiring TOTP verification`);
      // Return a flag indicating 2FA is required
      // Don't generate tokens yet - wait for 2FA verification
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenantId,
        },
        requiresTwoFactor: true,
        // Return empty tokens - will be generated after 2FA verification
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
      };
    }

    // Generate tokens (2FA not enabled)
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
      requiresTwoFactor: false,
    };
  }

  /**
   * Complete Login with 2FA Verification
   * 
   * Completes the login process after 2FA verification.
   * Generates and returns JWT tokens.
   * 
   * @param email - User email
   * @param totpToken - Verified TOTP token
   * @returns AuthTokens with user data
   */
  async completeLoginWith2FA(email: string, totpToken: string): Promise<AuthTokens & { user: any }> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('User not found');
    }

    // Verify 2FA is enabled
    if (!user.totpEnabled) {
      throw new UnauthorizedException('2FA is not enabled for this user');
    }

    // Verify TOTP token (this will be done by the controller calling TwoFactorService)
    // For now, we'll assume it's verified and generate tokens

    // Generate tokens
    const tokens = await this.generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      roles: ['user'],
      permissions: [],
      email: user.email,
      name: user.name,
    });

    this.logger.log(`[AUTH] User ${user.email} logged in successfully with 2FA`);

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

  /**
   * OAuth Callback Handler
   * 
   * Exchanges OAuth authorization code for access tokens and creates/updates user account.
   * Supports Google, Microsoft, GitHub, and Apple OAuth providers.
   * 
   * @param body - OAuth callback data containing provider, code, codeVerifier, and redirectUri
   * @returns AuthResponseDto with user data and JWT tokens
   */
  async oauthCallback(body: {
    provider: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<AuthTokens & { user: any }> {
    const { provider, code, codeVerifier, redirectUri } = body;

    const allowedRedirects = [
      'http://localhost:5173/auth/callback/google',
      'http://localhost:5173/auth/callback/microsoft',
      'http://localhost:5173/auth/callback/github',
      'http://localhost:5173/auth/callback/apple',
      process.env.OAUTH_REDIRECT_URI,
      process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/auth/callback/${provider}` : null,
    ].filter(Boolean) as string[];

    if (!allowedRedirects.some(allowed => redirectUri.startsWith(allowed))) {
      throw new UnauthorizedException('Invalid redirect URI');
    }

    this.logger.log(`[OAUTH] Processing callback for provider: ${provider}`);

    try {
      const oauthTokens = await this.exchangeOAuthCode(provider, code, codeVerifier, redirectUri);
      
      // Get user info from OAuth provider
      const oauthUserInfo = await this.getOAuthUserInfo(provider, oauthTokens.access_token);
      
      // Find or create user in database
      let user = await this.prisma.user.findUnique({
        where: { email: oauthUserInfo.email }
      });

      if (!user) {
        // Create new user from OAuth
        const tenant = await this.prisma.tenant.create({
          data: {
            name: `${oauthUserInfo.name || oauthUserInfo.email}'s Workspace`,
            slug: `tenant-${Date.now()}`,
          }
        });

        // Create user - only include fields that exist in the Prisma schema
        // Note: The schema doesn't have oauthProvider/oauthId fields, so we don't include them
        user = await this.prisma.user.create({
          data: {
            email: oauthUserInfo.email,
            name: oauthUserInfo.name || oauthUserInfo.email.split('@')[0],
            tenantId: tenant.id,
            // OAuth users don't have passwords - set to null
            password: null,
          }
        });

        // Create UserTenant relationship
        await this.prisma.userTenant.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: 'owner',
          }
        });

        this.logger.log(`[OAUTH] Created new user from ${provider}: ${user.email}`);
      } else {
        // User already exists - ensure they have a tenant
        if (!user.tenantId) {
          // Create a tenant for existing user
          const tenant = await this.prisma.tenant.create({
            data: {
              name: `${user.name}'s Workspace`,
              slug: `tenant-${Date.now()}`,
            }
          });

          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { tenantId: tenant.id }
          });

          // Create UserTenant relationship
          await this.prisma.userTenant.create({
            data: {
              userId: user.id,
              tenantId: tenant.id,
              role: 'owner',
            }
          });

          this.logger.log(`[OAUTH] Assigned tenant to existing user: ${user.email}`);
        }
      }

      // Ensure user has tenantId
      if (!user.tenantId) {
        this.logger.error(`[OAUTH ERROR] User ${user.id} has no tenantId. Cannot generate token.`);
        throw new UnauthorizedException('User account misconfigured: missing tenant information');
      }

      // Generate JWT tokens
      const tokens = await this.generateTokens({
        userId: user.id,
        tenantId: user.tenantId,
        roles: ['user'],
        permissions: [],
        email: user.email,
        name: user.name,
      });

      this.logger.log(`[OAUTH] User ${user.email} authenticated via ${provider}`);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenantId,
        },
        ...tokens,
      };
    } catch (error: any) {
      this.logger.error(`[OAUTH ERROR] Failed to process ${provider} callback:`, error);
      this.logger.error(`[OAUTH ERROR] Error stack:`, error?.stack);
      const errorMessage = error?.message || 'OAuth authentication failed';
      throw new UnauthorizedException(errorMessage);
    }
  }

  /**
   * Exchange OAuth authorization code for access token
   */
  private async exchangeOAuthCode(
    provider: string,
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const config = this.getOAuthConfig(provider);
    
    this.logger.log(`[OAUTH] Exchanging code for ${provider} with redirectUri: ${redirectUri}`);
    
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`[OAUTH ERROR] Token exchange failed for ${provider}: ${response.status} ${response.statusText}`);
      this.logger.error(`[OAUTH ERROR] Error details: ${errorText}`);
      throw new Error(`Failed to exchange OAuth code (${response.status}): ${errorText}`);
    }

    const tokenData = await response.json() as OAuthTokenResponse;
    
    if (!tokenData.access_token) {
      this.logger.error(`[OAUTH ERROR] Token response missing access_token for ${provider}`);
      throw new Error('Invalid OAuth token response: missing access_token');
    }

    this.logger.log(`[OAUTH] Successfully exchanged code for ${provider} access token`);
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    };
  }

  /**
   * Get user information from OAuth provider
   */
  private async getOAuthUserInfo(
    provider: string,
    accessToken: string
  ): Promise<{ id: string; email: string; name?: string }> {
    const config = this.getOAuthConfig(provider);
    
    // For Google, try the primary endpoint first
    let userInfoUrl = config.userInfoUrl;
    if (provider === 'google' && config.userInfoUrlFallback) {
      // Try primary endpoint first
      userInfoUrl = config.userInfoUrl;
    }
    
    this.logger.log(`[OAUTH] Fetching user info from ${provider} using URL: ${userInfoUrl}`);
    
    let response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // If Google primary endpoint fails, try fallback
    if (!response.ok && provider === 'google' && config.userInfoUrlFallback) {
      this.logger.warn(`[OAUTH] Primary endpoint failed, trying fallback: ${config.userInfoUrlFallback}`);
      response = await fetch(config.userInfoUrlFallback, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`[OAUTH ERROR] Failed to get user info from ${provider}: ${response.status} ${response.statusText}`);
      this.logger.error(`[OAUTH ERROR] Error details: ${errorText}`);
      throw new Error(`Failed to get user info from ${provider} (${response.status}): ${errorText}`);
    }

    // Normalize user info across providers
    switch (provider) {
      case 'google': {
        const data = await response.json() as any; // Use any to handle different response formats
        
        this.logger.log(`[OAUTH] Google user info received, keys: ${Object.keys(data).join(', ')}`);
        
        // Google might return 'id' instead of 'sub' in some cases, or both
        const userId = data.sub || data.id || data.user_id;
        const userEmail = data.email || data.emailAddress;
        
        // Check if we have the required fields
        if (!userId || !userEmail) {
          this.logger.error(`[OAUTH ERROR] Google user info missing required fields. Has sub: ${!!data.sub}, id: ${!!data.id}, email: ${!!data.email}`);
          throw new Error(`Invalid Google user info response: missing ${!userId ? 'user id (sub/id)' : ''} ${!userEmail ? 'email' : ''}`);
        }
        
        this.logger.log(`[OAUTH] Google user info parsed successfully`);
        return {
          id: userId,
          email: userEmail,
          name: data.name || data.displayName || data.given_name || undefined,
        };
      }
      case 'microsoft': {
        const data = await response.json() as MicrosoftUserInfo;
        if (!data.id) {
          throw new Error('Invalid Microsoft user info response');
        }
        const email = data.mail || data.userPrincipalName;
        if (!email) {
          throw new Error('Microsoft user info missing email');
        }
        return {
          id: data.id,
          email: email,
          name: data.displayName,
        };
      }
      case 'github': {
        const data = await response.json() as GitHubUserInfo;
        if (!data.id) {
          throw new Error('Invalid GitHub user info response');
        }
        // GitHub may not return email in public profile, need to fetch separately
        const email = data.email || `${data.login}@users.noreply.github.com`;
        return {
          id: data.id.toString(),
          email: email,
          name: data.name || data.login,
        };
      }
      case 'apple': {
        const data = await response.json() as AppleUserInfo;
        if (!data.sub) {
          throw new Error('Invalid Apple user info response');
        }
        if (!data.email) {
          throw new Error('Apple user info missing email');
        }
        return {
          id: data.sub,
          email: data.email,
          name: data.name,
        };
      }
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Get OAuth configuration for a provider
   */
  private getOAuthConfig(provider: string) {
    const configs: Record<string, any> = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        // Use standard v2 userinfo endpoint
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        // Fallback to OpenID Connect endpoint if needed
        userInfoUrlFallback: 'https://openidconnect.googleapis.com/v1/userinfo',
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID || '',
        clientSecret: process.env.APPLE_CLIENT_SECRET || '',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        userInfoUrl: 'https://appleid.apple.com/auth/userinfo',
      },
    };

    const config = configs[provider];
    if (!config || !config.clientId || !config.clientSecret) {
      throw new Error(`OAuth provider ${provider} is not configured`);
    }

    return config;
  }
} 