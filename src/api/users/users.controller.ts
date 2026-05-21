import { Controller, Get, Put, Param, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

/**
 * Users Controller
 * 
 * Handles user management endpoints including:
 * - Listing tenant users
 * - Getting user details
 * - Updating user information
 * - Resetting passwords
 * - Getting workspace statistics
 * 
 * All endpoints require authentication and are tenant-scoped.
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users for the current tenant
   * Returns users with their roles and status
   * 
   * @param req - Authenticated request with tenant ID
   * @returns List of users
   */
  @Get()
  @ApiOperation({ summary: 'Get all tenant users', description: 'Returns all users belonging to the current tenant with their roles and status' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getTenantUsers(@Request() req: any) {
    return this.usersService.getTenantUsers(req.user.tenantId);
  }

  /**
   * Get detailed user information
   * Includes project and task counts
   * 
   * @param req - Authenticated request with tenant ID
   * @param id - User ID
   * @returns Detailed user information
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user details', description: 'Returns detailed information about a specific user including project and task counts' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Request() req: any, @Param('id') id: string) {
    return this.usersService.getUserDetails(req.user.tenantId, id);
  }

  /**
   * Update user information
   * Allows updating name and email
   * 
   * @param req - Authenticated request with tenant ID
   * @param id - User ID
   * @param body - Update data (name, email)
   * @returns Updated user
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user', description: 'Updates user information (name, email)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string }
  ) {
    return this.usersService.updateUser(req.user.tenantId, id, body);
  }

  /**
   * Reset user password
   * Generates a temporary password (in production, sends via email)
   * 
   * @param req - Authenticated request with tenant ID
   * @param id - User ID
   * @returns Success message with temporary password
   */
  @Put(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password', description: 'Resets a user password and generates a temporary password' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetUserPassword(@Request() req: any, @Param('id') id: string) {
    return this.usersService.resetUserPassword(req.user.tenantId, id);
  }

  /**
   * Get workspace statistics
   * Returns counts of users, projects, tasks, and usage metrics
   * 
   * @param req - Authenticated request with tenant ID
   * @returns Workspace statistics
   */
  @Get('admin/stats')
  @ApiOperation({ summary: 'Get workspace statistics', description: 'Returns workspace statistics including user counts, project counts, task counts, and usage metrics' })
  @ApiResponse({ status: 200, description: 'Workspace statistics retrieved successfully' })
  async getWorkspaceStats(@Request() req: any) {
    return this.usersService.getWorkspaceStats(req.user.tenantId);
  }
}

