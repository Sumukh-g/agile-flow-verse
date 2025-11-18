"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectManagementModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const prisma_module_1 = require("../prisma/prisma.module");
const project_management_controller_1 = require("./project-management.controller");
const gantt_service_1 = require("./gantt.service");
const resource_management_service_1 = require("./resource-management.service");
let ProjectManagementModule = class ProjectManagementModule {
};
exports.ProjectManagementModule = ProjectManagementModule;
exports.ProjectManagementModule = ProjectManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        controllers: [project_management_controller_1.ProjectManagementController],
        providers: [gantt_service_1.GanttService, resource_management_service_1.ResourceManagementService],
        exports: [gantt_service_1.GanttService, resource_management_service_1.ResourceManagementService],
    })
], ProjectManagementModule);
