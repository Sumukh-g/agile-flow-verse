import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto, RefreshTokenDto, SignupDto } from './dto';

@ApiTags('Authentication')
@Controller('/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
