"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const crm_service_1 = require("./crm.service");
let CrmController = class CrmController {
    constructor(svc) {
        this.svc = svc;
    }
    // --- Clients ---
    listClients(req) {
        return this.svc.listClients(req.user.tenantId);
    }
    getClient(id, req) {
        return this.svc.getClient(req.user.tenantId, id);
    }
    createClient(body, req) {
        return this.svc.createClient(req.user.tenantId, req.user.userId, body);
    }
    updateClient(id, body, req) {
        return this.svc.updateClient(req.user.tenantId, id, body);
    }
    removeClient(id, req) {
        return this.svc.deleteClient(req.user.tenantId, id);
    }
    // --- CRM Projects ---
    listCrmProjects(req) {
        return this.svc.listCrmProjects(req.user.tenantId);
    }
    getCrmProject(id, req) {
        return this.svc.getCrmProject(req.user.tenantId, id);
    }
    createCrmProject(body, req) {
        return this.svc.createCrmProject(req.user.tenantId, req.user.userId, body);
    }
    updateCrmProject(id, body, req) {
        return this.svc.updateCrmProject(req.user.tenantId, id, body);
    }
    removeCrmProject(id, req) {
        return this.svc.deleteCrmProject(req.user.tenantId, id);
    }
    // --- Deals ---
    listDeals(req) {
        return this.svc.listDeals(req.user.tenantId);
    }
    getDeal(id, req) {
        return this.svc.getDeal(req.user.tenantId, id);
    }
    createDeal(body, req) {
        return this.svc.createDeal(req.user.tenantId, req.user.userId, body);
    }
    updateDeal(id, body, req) {
        return this.svc.updateDeal(req.user.tenantId, id, body);
    }
    removeDeal(id, req) {
        return this.svc.deleteDeal(req.user.tenantId, id);
    }
    // --- Summary ---
    getSummary(req) {
        return this.svc.summary(req.user.tenantId);
    }
    // --- Meetings ---
    scheduleMeeting(body, req) {
        return this.svc.scheduleMeeting(req.user.tenantId, req.user.userId, body);
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('clients'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "listClients", null);
__decorate([
    (0, common_1.Get)('clients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getClient", null);
__decorate([
    (0, common_1.Post)('clients'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createClient", null);
__decorate([
    (0, common_1.Put)('clients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "updateClient", null);
__decorate([
    (0, common_1.Delete)('clients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "removeClient", null);
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "listCrmProjects", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getCrmProject", null);
__decorate([
    (0, common_1.Post)('projects'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createCrmProject", null);
__decorate([
    (0, common_1.Put)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "updateCrmProject", null);
__decorate([
    (0, common_1.Delete)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "removeCrmProject", null);
__decorate([
    (0, common_1.Get)('deals'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "listDeals", null);
__decorate([
    (0, common_1.Get)('deals/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getDeal", null);
__decorate([
    (0, common_1.Post)('deals'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createDeal", null);
__decorate([
    (0, common_1.Put)('deals/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "updateDeal", null);
__decorate([
    (0, common_1.Delete)('deals/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "removeDeal", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('meetings'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "scheduleMeeting", null);
exports.CrmController = CrmController = __decorate([
    (0, swagger_1.ApiTags)('crm'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('/v1/crm'),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
