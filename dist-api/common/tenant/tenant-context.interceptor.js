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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
const request_context_1 = require("./request-context");
let TenantContextInterceptor = class TenantContextInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const traceId = req.traceId;
        // Prefer tenantId from the verified JWT. Only fall back to header for legacy/dev scenarios.
        const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
        const userId = req.user?.userId || null;
        const roles = Array.isArray(req.user?.roles)
            ? req.user?.roles
            : typeof req.user?.roles === 'string'
                ? req.user.roles.split(',').map((r) => r.trim())
                : [];
        // Wrap each request in a single transaction and set RLS session vars
        return (0, rxjs_1.from)(this.prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe("select set_config('app.tenant_id', $1, true)", tenantId || '');
            await tx.$executeRawUnsafe("select set_config('app.roles', $1, true)", roles.join(','));
            return await request_context_1.requestContext.run({
                traceId,
                tenantId: tenantId || '',
                userId,
                roles,
                prisma: tx,
            }, async () => {
                return await (0, rxjs_1.lastValueFrom)(next.handle());
            });
        }));
    }
};
exports.TenantContextInterceptor = TenantContextInterceptor;
exports.TenantContextInterceptor = TenantContextInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantContextInterceptor);
