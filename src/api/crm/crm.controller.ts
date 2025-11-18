import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CrmService } from './crm.service';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1/crm')
export class CrmController {
  constructor(private readonly svc: CrmService) {}

  // --- Clients ---
  @Get('clients')
  listClients(@Request() req: any) {
    return this.svc.listClients(req.user.tenantId);
  }

  @Get('clients/:id')
  getClient(@Param('id') id: string, @Request() req: any) {
    return this.svc.getClient(req.user.tenantId, id);
  }

  @Post('clients')
  createClient(@Body() body: any, @Request() req: any) {
    return this.svc.createClient(req.user.tenantId, req.user.userId, body);
  }

  @Put('clients/:id')
  updateClient(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.updateClient(req.user.tenantId, id, body);
  }

  @Delete('clients/:id')
  removeClient(@Param('id') id: string, @Request() req: any) {
    return this.svc.deleteClient(req.user.tenantId, id);
  }

  // --- CRM Projects ---
  @Get('projects')
  listCrmProjects(@Request() req: any) {
    return this.svc.listCrmProjects(req.user.tenantId);
  }

  @Get('projects/:id')
  getCrmProject(@Param('id') id: string, @Request() req: any) {
    return this.svc.getCrmProject(req.user.tenantId, id);
  }

  @Post('projects')
  createCrmProject(@Body() body: any, @Request() req: any) {
    return this.svc.createCrmProject(req.user.tenantId, req.user.userId, body);
  }

  @Put('projects/:id')
  updateCrmProject(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.updateCrmProject(req.user.tenantId, id, body);
  }

  @Delete('projects/:id')
  removeCrmProject(@Param('id') id: string, @Request() req: any) {
    return this.svc.deleteCrmProject(req.user.tenantId, id);
  }

  // --- Deals ---
  @Get('deals')
  listDeals(@Request() req: any) {
    return this.svc.listDeals(req.user.tenantId);
  }

  @Get('deals/:id')
  getDeal(@Param('id') id: string, @Request() req: any) {
    return this.svc.getDeal(req.user.tenantId, id);
  }

  @Post('deals')
  createDeal(@Body() body: any, @Request() req: any) {
    return this.svc.createDeal(req.user.tenantId, req.user.userId, body);
  }

  @Put('deals/:id')
  updateDeal(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.updateDeal(req.user.tenantId, id, body);
  }

  @Delete('deals/:id')
  removeDeal(@Param('id') id: string, @Request() req: any) {
    return this.svc.deleteDeal(req.user.tenantId, id);
  }

  // --- Summary ---
  @Get('summary')
  getSummary(@Request() req: any) {
    return this.svc.summary(req.user.tenantId);
  }

  // --- Meetings ---
  @Post('meetings')
  scheduleMeeting(@Body() body: { clientId: string; start: string; title?: string; notes?: string }, @Request() req: any) {
    return this.svc.scheduleMeeting(req.user.tenantId, req.user.userId, body);
  }
}

