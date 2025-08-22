"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const JWKS_URI = process.env.KEYCLOAK_JWKS_URI || 'http://localhost:8080/realms/master/protocol/openid-connect/certs';
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_CLIENT_ID || 'agile-flow-verse';
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/master';
const jwksClient = (0, jwks_rsa_1.default)({ jwksUri: JWKS_URI });
class AuthService {
    async getKey(header) {
        const key = await jwksClient.getSigningKey(header.kid);
        return key.getPublicKey();
    }
    async verifyToken(bearer) {
        const token = bearer.replace(/^Bearer\s+/i, '');
        const decoded = await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, async (header, cb) => cb(null, await this.getKey(header)), {
                audience: KEYCLOAK_AUDIENCE,
                issuer: KEYCLOAK_ISSUER,
                algorithms: ['RS256'],
            }, (err, payload) => (err ? reject(err) : resolve(payload)));
        });
        // Map claims -> app identity (customize as needed)
        const userId = decoded.sub;
        const tenantId = decoded['tenant_id'] || decoded['orgId'] || '';
        const rolesClaim = (decoded['realm_access']?.roles || []);
        return {
            userId,
            tenantId,
            roles: rolesClaim,
            email: decoded.email,
            name: decoded.name,
        };
    }
}
exports.AuthService = AuthService;
