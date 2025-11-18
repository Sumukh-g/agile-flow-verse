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
        if (url.startsWith('/v1/health') ||
            url.startsWith('/v1/docs') ||
            url.startsWith('/v1/auth')) {
            console.log('[GUARD DEBUG] Public route allowed:', url);
            return true;
        }
        const authz = req.headers.authorization;
        console.log('[GUARD DEBUG] Protected route:', url);
        console.log('[GUARD DEBUG] Authorization header present:', !!authz);
        if (!authz) {
            console.error('[GUARD DEBUG] REJECTED: No Authorization header');
            throw new common_1.UnauthorizedException('Missing Authorization header');
        }
        try {
            const decoded = await this.auth.verifyToken(authz);
            req.user = decoded;
            console.log('[GUARD DEBUG] Token verified, user:', decoded.userId, 'tenant:', decoded.tenantId);
            // Tenant ID must come from the token, not headers
            if (!decoded.tenantId) {
                console.error('[GUARD DEBUG] REJECTED: No tenantId in decoded token');
                throw new common_1.UnauthorizedException('Token missing tenant information');
            }
            console.log('[GUARD DEBUG] Request ALLOWED');
            return true;
        }
        catch (error) {
            console.error('[GUARD DEBUG] REJECTED: Token verification failed:', error.message);
            throw error; // Re-throw the original error with specific message
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], JwtAuthGuard);
