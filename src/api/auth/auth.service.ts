import jwt, { JwtHeader } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

export type DecodedUser = {
  userId: string;
  tenantId: string;
  roles: string[];
  email?: string;
  name?: string;
};

const JWKS_URI = process.env.KEYCLOAK_JWKS_URI || 'http://localhost:8080/realms/master/protocol/openid-connect/certs';
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_CLIENT_ID || 'agile-flow-verse';
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/master';

const jwksClient = jwksRsa({ jwksUri: JWKS_URI });

export class AuthService {
  private async getKey(header: JwtHeader): Promise<string> {
    const key = await jwksClient.getSigningKey(header.kid as string);
    return key.getPublicKey();
  }

  async verifyToken(bearer: string): Promise<DecodedUser> {
    const token = bearer.replace(/^Bearer\s+/i, '');
    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        async (header, cb) => cb(null, await this.getKey(header as JwtHeader)),
        {
          audience: KEYCLOAK_AUDIENCE,
          issuer: KEYCLOAK_ISSUER,
          algorithms: ['RS256'],
        },
        (err, payload) => (err ? reject(err) : resolve(payload)),
      );
    });

    // Map claims -> app identity (customize as needed)
    const userId = decoded.sub as string;
    const tenantId = (decoded['tenant_id'] as string) || (decoded['orgId'] as string) || '';
    const rolesClaim = (decoded['realm_access']?.roles || []) as string[];

    return {
      userId,
      tenantId,
      roles: rolesClaim,
      email: decoded.email,
      name: decoded.name,
    };
  }
} 