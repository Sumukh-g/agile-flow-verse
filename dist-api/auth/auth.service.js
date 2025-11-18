"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const prisma_service_1 = require("../prisma/prisma.service");
const JWKS_URI = process.env.KEYCLOAK_JWKS_URI || 'http://localhost:8080/realms/master/protocol/openid-connect/certs';
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_CLIENT_ID || 'agile-flow-verse';
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/master';
const jwksClient = (0, jwks_rsa_1.default)({ jwksUri: JWKS_URI });
let AuthService = AuthService_1 = class AuthService {
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async getKey(header) {
        const key = await jwksClient.getSigningKey(header.kid);
        return key.getPublicKey();
    }
    async verifyToken(bearer) {
        const token = bearer.replace(/^Bearer\s+/i, '');
        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            this.logger.error('[AUTH ERROR] JWT_SECRET is not configured. Cannot verify tokens.');
            throw new common_1.UnauthorizedException('Authentication service misconfigured: JWT_SECRET missing');
        }
        console.log('[AUTH DEBUG] Verifying token, length:', token.length);
        console.log('[AUTH DEBUG] JWT_SECRET set:', !!process.env.JWT_SECRET);
        console.log('[AUTH DEBUG] Token preview:', token.substring(0, 50) + '...');
        // Try local JWT verification first (HS256 with JWT_SECRET)
        try {
            const decoded = this.jwtService.verify(token);
            console.log('[AUTH DEBUG] Local JWT verification SUCCESS');
            console.log('[AUTH DEBUG] Decoded payload:', JSON.stringify({ sub: decoded.sub, tenantId: decoded.tenantId, email: decoded.email }));
            // Local tokens have tenantId directly in payload
            const userId = decoded.sub || decoded.userId;
            const tenantId = decoded.tenantId || '';
            const roles = decoded.roles || [];
            if (!userId) {
                console.error('[AUTH DEBUG] REJECTED: No userId in token');
                throw new common_1.UnauthorizedException('Token missing userId');
            }
            if (!tenantId) {
                console.error('[AUTH DEBUG] REJECTED: No tenantId in token');
                throw new common_1.UnauthorizedException('Token missing tenantId');
            }
            // Get user permissions from database
            const userPermissions = await this.getUserPermissions(userId, tenantId);
            console.log('[AUTH DEBUG] User permissions loaded:', userPermissions.length);
            return {
                userId,
                tenantId,
                roles,
                permissions: userPermissions,
                email: decoded.email,
                name: decoded.name,
            };
        }
        catch (localError) {
            const errorMessage = localError.message;
            console.error('[AUTH DEBUG] Local JWT verification FAILED:', errorMessage);
            // Provide more specific error messages
            if (errorMessage.includes('secret') || errorMessage.includes('signature')) {
                this.logger.error('[AUTH ERROR] Token signature verification failed. JWT_SECRET may be incorrect.');
                throw new common_1.UnauthorizedException('Invalid token signature');
            }
            if (errorMessage.includes('expired')) {
                throw new common_1.UnauthorizedException('Token expired');
            }
            if (errorMessage.includes('malformed') || errorMessage.includes('invalid')) {
                throw new common_1.UnauthorizedException('Invalid token format');
            }
            // Skip Keycloak if disabled
            const enableKeycloak = process.env.ENABLE_KEYCLOAK === 'true';
            if (!enableKeycloak) {
                console.error('[AUTH DEBUG] Keycloak disabled, rejecting token');
                throw new common_1.UnauthorizedException(`Invalid token: ${errorMessage}`);
            }
            // If local verification fails, try Keycloak (RS256 with JWKS)
            try {
                console.log('[AUTH DEBUG] Trying Keycloak verification...');
                const decoded = await new Promise((resolve, reject) => {
                    jsonwebtoken_1.default.verify(token, async (header, cb) => {
                        try {
                            const key = await this.getKey(header);
                            cb(null, key);
                        }
                        catch (err) {
                            cb(err, null);
                        }
                    }, {
                        audience: KEYCLOAK_AUDIENCE,
                        issuer: KEYCLOAK_ISSUER,
                        algorithms: ['RS256'],
                    }, (err, payload) => (err ? reject(err) : resolve(payload)));
                });
                console.log('[AUTH DEBUG] Keycloak verification SUCCESS');
                // Map Keycloak claims -> app identity
                const userId = decoded.sub;
                const tenantId = decoded['tenant_id'] || decoded['orgId'] || '';
                const rolesClaim = (decoded['realm_access']?.roles || []);
                // Get user permissions from database
                const userPermissions = await this.getUserPermissions(userId, tenantId);
                return {
                    userId,
                    tenantId,
                    roles: rolesClaim,
                    permissions: userPermissions,
                    email: decoded.email,
                    name: decoded.name,
                };
            }
            catch (keycloakError) {
                console.error('[AUTH DEBUG] Keycloak verification FAILED:', keycloakError.message);
                throw new common_1.UnauthorizedException('Invalid token');
            }
        }
    }
    async generateTokens(user) {
        // Validate required fields
        if (!user.userId) {
            throw new Error('Cannot generate token: userId is required');
        }
        if (!user.tenantId) {
            throw new Error('Cannot generate token: tenantId is required');
        }
        const payload = {
            sub: user.userId,
            tenantId: user.tenantId,
            roles: user.roles || [],
            permissions: user.permissions || [],
            email: user.email,
            name: user.name,
        };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign({ sub: user.userId, tenantId: user.tenantId }, { expiresIn: '7d' });
        // Store refresh token in database
        await this.storeRefreshToken(user.userId, user.tenantId, refreshToken);
        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes
        };
    }
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = this.jwtService.verify(refreshToken);
            const user = await this.getUserById(decoded.sub, decoded.tenantId);
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const tokens = await this.generateTokens(user);
            return {
                user: {
                    id: user.userId,
                    name: user.name || '',
                    email: user.email || '',
                    tenantId: user.tenantId,
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async revokeToken(refreshToken) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async hasPermission(userId, tenantId, permission) {
        const userPermissions = await this.getUserPermissions(userId, tenantId);
        return userPermissions.includes(permission) || userPermissions.includes('*');
    }
    async hasRole(userId, tenantId, role) {
        const userRoles = await this.getUserRoles(userId, tenantId);
        return userRoles.includes(role);
    }
    async getUserPermissions(userId, tenantId) {
        const roleAssignments = await this.prisma.roleAssignment.findMany({
            where: { userId, tenantId },
            include: { role: true },
        });
        const permissions = new Set();
        roleAssignments.forEach(assignment => {
            assignment.role.permissions.forEach(permission => {
                permissions.add(permission);
            });
        });
        return Array.from(permissions);
    }
    async getUserRoles(userId, tenantId) {
        const roleAssignments = await this.prisma.roleAssignment.findMany({
            where: { userId, tenantId },
            include: { role: true },
        });
        return roleAssignments.map(assignment => assignment.role.name);
    }
    async getUserById(userId, tenantId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });
        if (!user)
            return null;
        const permissions = await this.getUserPermissions(userId, tenantId);
        const roles = await this.getUserRoles(userId, tenantId);
        return {
            userId: user.id,
            tenantId: user.tenantId,
            roles,
            permissions,
            email: user.email,
            name: user.name,
        };
    }
    async storeRefreshToken(userId, tenantId, token) {
        const hashedToken = await bcrypt.hash(token, 10);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tenantId,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
    }
    async signup(dto) {
        // Check if user exists
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        // Get or create default tenant
        let tenant = await this.prisma.tenant.findFirst({
            where: { slug: 'default' }
        });
        if (!tenant) {
            tenant = await this.prisma.tenant.create({
                data: {
                    name: 'Default Tenant',
                    slug: 'default',
                    sku: 'basic'
                }
            });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                password: hashedPassword,
                tenantId: tenant.id,
            }
        });
        // Generate tokens
        const tokens = await this.generateTokens({
            userId: user.id,
            tenantId: user.tenantId,
            roles: ['user'],
            permissions: [],
            email: user.email,
            name: user.name,
        });
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                tenantId: user.tenantId,
            },
            ...tokens,
        };
    }
    async login(dto) {
        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            this.logger.error('[AUTH ERROR] JWT_SECRET is not configured. Cannot generate tokens.');
            throw new common_1.UnauthorizedException('Authentication service misconfigured: JWT_SECRET missing');
        }
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });
        if (!user || !user.password) {
            this.logger.warn(`[AUTH] Login attempt failed: User not found or no password set for ${dto.email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Verify password
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) {
            this.logger.warn(`[AUTH] Login attempt failed: Invalid password for ${dto.email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Ensure user has tenantId
        if (!user.tenantId) {
            this.logger.error(`[AUTH ERROR] User ${user.id} has no tenantId. Cannot generate token.`);
            throw new common_1.UnauthorizedException('User account misconfigured: missing tenant information');
        }
        // Generate tokens
        const tokens = await this.generateTokens({
            userId: user.id,
            tenantId: user.tenantId,
            roles: ['user'],
            permissions: [],
            email: user.email,
            name: user.name,
        });
        this.logger.log(`[AUTH] User ${user.email} logged in successfully`);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                tenantId: user.tenantId,
            },
            ...tokens,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
