import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ description: 'User password', example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ description: 'Company/Organization name', example: 'My Company' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tenantName?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ description: 'User password', example: 'securePassword123' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information',
  })
  user!: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
  };

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  expiresIn!: number;
}
