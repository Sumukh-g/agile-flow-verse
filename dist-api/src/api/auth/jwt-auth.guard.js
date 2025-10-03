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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(auth) {
        this.auth = auth;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        // Public routes
        const url = req.url || '';
        if (url.startsWith('/v1/health') || url.startsWith('/v1/docs')) {
            return true;
        }
        const authz = req.headers.authorization;
        // Development mode: Allow requests without auth header for demo users
        if (!authz) {
            // Check if this is a demo request (from our frontend)
            const userAgent = req.headers['user-agent'] || '';
            const isDemoRequest = userAgent.includes('localhost:5173') ||
                req.headers['x-demo-user'] === 'true' ||
                req.headers['x-tenant-id'] === 'dev';
            if (isDemoRequest) {
                // Create a demo user for development
                req.user = {
                    userId: 'demo-user-' + Date.now(),
                    tenantId: req.headers['x-tenant-id'] || 'dev',
                    roles: ['user'],
                    email: 'demo@example.com',
                    name: 'Demo User'
                };
                return true;
            }
            throw new common_1.UnauthorizedException('Missing Authorization header');
        }
        try {
            const decoded = await this.auth.verifyToken(authz);
            req.user = decoded;
            if (!decoded.tenantId) {
                // Allow dev header fallback
                const hTenant = req.headers['x-tenant-id'] || '';
                req.user.tenantId = hTenant;
            }
            return true;
        }
        catch (error) {
            // In development, allow demo users even with invalid tokens
            const isDemoRequest = req.headers['x-demo-user'] === 'true' ||
                req.headers['x-tenant-id'] === 'dev';
            if (isDemoRequest) {
                req.user = {
                    userId: 'demo-user-' + Date.now(),
                    tenantId: req.headers['x-tenant-id'] || 'dev',
                    roles: ['user'],
                    email: 'demo@example.com',
                    name: 'Demo User'
                };
                return true;
            }
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], JwtAuthGuard);
