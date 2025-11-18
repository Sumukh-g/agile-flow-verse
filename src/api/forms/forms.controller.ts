import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FormsService } from './forms.service';
import { CreateFormDto, UpdateFormDto, SubmitFormResponseDto, ShareFormDto } from './dto';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/forms')
export class FormsController {
  constructor(private readonly svc: FormsService) {}

  @Get()
  @ApiOperation({ summary: 'List forms', description: 'Get all forms for the tenant, optionally filtered by project' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiResponse({ status: 200, description: 'Forms retrieved successfully' })
  async list(@Query('projectId') projectId: string | undefined, @Request() req: any) {
    return this.svc.list(req.user.tenantId, projectId, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form by ID', description: 'Get a single form with all details' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 200, description: 'Form retrieved successfully' })
  async get(@Param('id') id: string, @Request() req: any) {
    return this.svc.get(req.user.tenantId, id, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create form', description: 'Create a new form' })
  @ApiResponse({ status: 201, description: 'Form created successfully' })
  async create(@Body() body: CreateFormDto, @Request() req: any) {
    return this.svc.create(req.user.tenantId, req.user.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update form', description: 'Update an existing form' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 200, description: 'Form updated successfully' })
  async update(@Param('id') id: string, @Body() body: UpdateFormDto, @Request() req: any) {
    return this.svc.update(req.user.tenantId, id, req.user.userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete form', description: 'Delete a form and all its responses' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 200, description: 'Form deleted successfully' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.svc.delete(req.user.tenantId, id, req.user.userId);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Submit form response', description: 'Submit a response to a form' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  async submitResponse(@Param('id') id: string, @Body() body: SubmitFormResponseDto, @Request() req: any) {
    return this.svc.submitResponse(req.user.tenantId, id, req.user.userId, body);
  }

  @Get(':id/responses')
  @ApiOperation({ summary: 'List form responses', description: 'Get all responses for a form (creator only)' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 200, description: 'Responses retrieved successfully' })
  async listResponses(@Param('id') id: string, @Request() req: any) {
    return this.svc.listResponses(req.user.tenantId, id, req.user.userId);
  }

  @Post(':id/shares')
  @ApiOperation({ summary: 'Share form', description: 'Share a form with a user or make it public' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 201, description: 'Form shared successfully' })
  async share(@Param('id') id: string, @Body() body: ShareFormDto, @Request() req: any) {
    return this.svc.share(req.user.tenantId, id, req.user.userId, body);
  }

  @Get(':id/shares')
  @ApiOperation({ summary: 'List form shares', description: 'Get all shares for a form (creator only)' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 200, description: 'Shares retrieved successfully' })
  async listShares(@Param('id') id: string, @Request() req: any) {
    return this.svc.listShares(req.user.tenantId, id, req.user.userId);
  }

  @Delete('shares/:shareId')
  @ApiOperation({ summary: 'Delete form share', description: 'Remove a share from a form' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Share deleted successfully' })
  async deleteShare(@Param('shareId') shareId: string, @Request() req: any) {
    return this.svc.deleteShare(req.user.tenantId, shareId, req.user.userId);
  }

  @Post(':id/views')
  @ApiOperation({ summary: 'Increment form views', description: 'Increment the view count for a form' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({ status: 200, description: 'Views incremented' })
  async incrementViews(@Param('id') id: string, @Request() req: any) {
    await this.svc.incrementViews(req.user.tenantId, id);
    return { ok: true };
  }
}

