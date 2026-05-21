import { Body, Controller, HttpCode, HttpStatus, Post, Get, Put, Request, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { AuthResponseDto, LoginDto, RefreshTokenDto, SignupDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Authentication Controller
 * 
 * Handles all authentication-related endpoints including:
 * - User registration (signup)
 * - User login
 * - Token refresh
 * - User logout
 * 
 * All endpoints are public and do not require authentication.
 * Protected routes use the JwtAuthGuard which validates JWT tokens.
 */
@ApiTags('Authentication')
@Controller('/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * User Registration Endpoint
   * 
   * Creates a new user account with email and password.
   * Automatically creates a tenant for the user and assigns them as the tenant owner.
   * Returns JWT access and refresh tokens upon successful registration.
   * 
   * @param dto - Signup data containing email, password, and optional name
   * @returns AuthResponseDto with user data and tokens
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'User registration',
    description: 'Create a new user account with email and password'
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully created',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email already exists' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  async signup(@Body() dto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(dto);
  }

  /**
   * User Login Endpoint
   * 
   * Authenticates a user with email and password.
   * Validates credentials and returns JWT access and refresh tokens.
   * The access token contains user ID, tenant ID, and email.
   * 
   * @param dto - Login credentials (email and password)
   * @returns AuthResponseDto with user data and tokens
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user with email and password'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * Token Refresh Endpoint
   * 
   * Generates a new access token using a valid refresh token.
   * This allows users to maintain their session without re-authenticating.
   * The refresh token should be stored securely and rotated periodically.
   * 
   * @param body - Contains the refresh token
   * @returns AuthResponseDto with new access token and refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Get a new access token using refresh token'
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid refresh token' 
  })
  async refresh(@Body() body: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  /**
   * OAuth Callback Endpoint
   * 
   * Handles OAuth callbacks from providers (Google, Microsoft, GitHub, Apple).
   * Exchanges authorization codes for access tokens and creates/updates user accounts.
   * 
   * @param body - Contains provider, code, codeVerifier, and redirectUri
   * @returns AuthResponseDto with user data and tokens
   */
  @Post('oauth/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'OAuth callback',
    description: 'Handle OAuth callback from provider and exchange code for tokens'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OAuth authentication successful',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid OAuth code or provider' 
  })
  async oauthCallback(@Body() body: {
    provider: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<AuthResponseDto> {
    return this.authService.oauthCallback(body);
  }

  /**
   * Logout endpoint
   * Clears user session and invalidates tokens
   * Note: Since we're using stateless JWT tokens, logout is primarily handled client-side
   * by removing tokens from localStorage. This endpoint exists for consistency and
   * potential future server-side session management.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User logout',
    description: 'Logout user and invalidate refresh token.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful'
  })
  async logout(@Body() body: { refreshToken?: string }): Promise<{ message: string }> {
    if (body?.refreshToken) {
      await this.authService.revokeToken(body.refreshToken);
    }
    return { message: 'Logout successful' };
  }

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION (2FA) ENDPOINTS
  // ============================================================================

  /**
   * Generate TOTP Secret for 2FA Setup
   * 
   * Creates a new TOTP secret and QR code for the authenticated user.
   * The user must verify the token before 2FA is enabled.
   * 
   * @param req - Authenticated request with user info
   * @returns TOTP secret, QR code, and backup codes
   */
  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate TOTP secret for 2FA',
    description: 'Generate a new TOTP secret and QR code for setting up two-factor authentication'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'TOTP secret generated successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async generateTotpSecret(@Request() req: any) {
    return this.twoFactorService.generateTotpSecret(
      req.user.tenantId,
      req.user.userId,
      req.user.email
    );
  }

  /**
   * Verify TOTP Token During Setup
   * 
   * Verifies the TOTP token matches the stored secret.
   * If valid, enables 2FA for the user.
   * 
   * @param req - Authenticated request with user info
   * @param body - Contains the 6-digit TOTP token
   * @returns Success status
   */
  @Post('2fa/verify-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify TOTP token during setup',
    description: 'Verify the TOTP token to complete 2FA setup'
  })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { token: { type: 'string', description: '6-digit TOTP token' } },
      required: ['token']
    } 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'TOTP token verified and 2FA enabled'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid TOTP token' 
  })
  async verifyTotpSetup(@Request() req: any, @Body() body: { token: string }) {
    const verified = await this.twoFactorService.verifyTotpSetup(
      req.user.tenantId,
      req.user.userId,
      body.token
    );

    if (!verified) {
      throw new BadRequestException('Invalid TOTP token');
    }

    return { success: true, message: '2FA enabled successfully' };
  }

  /**
   * Complete Login with 2FA Verification
   * 
   * Verifies the TOTP token or backup code and completes the login process.
   * Returns JWT tokens upon successful verification.
   * 
   * @param body - Contains email and TOTP token/backup code
   * @returns AuthResponseDto with user data and tokens
   */
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Complete login with 2FA verification',
    description: 'Verify TOTP token or backup code and complete login for users with 2FA enabled'
  })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        email: { type: 'string' },
        token: { type: 'string', description: '6-digit TOTP token or backup code' }
      },
      required: ['email', 'token']
    } 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful with 2FA',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid TOTP token' 
  })
  async completeLoginWith2FA(@Body() body: { email: string; token: string }): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('User not found');
    }

    const verified = await this.twoFactorService.verifyTotpLogin(
      user.tenantId,
      user.id,
      body.token
    );

    if (!verified) {
      throw new UnauthorizedException('Invalid TOTP token or backup code');
    }

    // Complete login and generate tokens
    return this.authService.completeLoginWith2FA(body.email, body.token);
  }

  /**
   * Check if 2FA is Enabled
   * 
   * Returns whether the authenticated user has 2FA enabled.
   * 
   * @param req - Authenticated request with user info
   * @returns 2FA status
   */
  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Check 2FA status',
    description: 'Check if the authenticated user has 2FA enabled'
  })
  @ApiResponse({ 
    status: 200, 
    description: '2FA status retrieved'
  })
  async getTwoFactorStatus(@Request() req: any) {
    const enabled = await this.twoFactorService.isTwoFactorEnabled(
      req.user.tenantId,
      req.user.userId
    );

    return { enabled };
  }

  /**
   * Disable 2FA
   * 
   * Disables 2FA for the authenticated user.
   * Removes TOTP secret and backup codes.
   * 
   * @param req - Authenticated request with user info
   * @returns Success status
   */
  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Disable 2FA',
    description: 'Disable two-factor authentication for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: '2FA disabled successfully'
  })
  async disableTwoFactor(@Request() req: any) {
    await this.twoFactorService.disableTwoFactor(
      req.user.tenantId,
      req.user.userId
    );

    return { success: true, message: '2FA disabled successfully' };
  }

  /**
   * Regenerate Backup Codes
   * 
   * Generates new backup codes for the authenticated user.
   * Old backup codes are invalidated.
   * 
   * @param req - Authenticated request with user info
   * @returns New backup codes
   */
  @Post('2fa/regenerate-backup-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Regenerate backup codes',
    description: 'Generate new backup codes for 2FA. Old codes are invalidated.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Backup codes regenerated'
  })
  async regenerateBackupCodes(@Request() req: any) {
    return this.twoFactorService.regenerateBackupCodes(
      req.user.tenantId,
      req.user.userId
    );
  }
}
