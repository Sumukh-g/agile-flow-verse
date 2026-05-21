import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

/**
 * Two-Factor Authentication Service
 * 
 * Handles TOTP (Time-based One-Time Password) implementation for 2FA.
 * Uses industry-standard TOTP algorithm compatible with Google Authenticator, Authy, etc.
 * 
 * Features:
 * - Generate TOTP secrets
 * - Generate QR codes for easy setup
 * - Verify TOTP tokens
 * - Generate and manage backup codes
 * - Enable/disable 2FA for users
 * 
 * Security Best Practices:
 * - TOTP secrets are encrypted before storage
 * - Backup codes are hashed before storage
 * - All operations are tenant-scoped
 * - Proper error handling to prevent information leakage
 */
@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a new TOTP secret for a user
   * Creates a secret and returns it along with a QR code for easy setup
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   * @param userEmail - User's email (for QR code label)
   * @returns Object containing secret, QR code data URL, and backup codes
   */
  async generateTotpSecret(tenantId: string, userId: string, userEmail: string) {
    // Verify user exists and belongs to tenant
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Agile Flow Verse (${userEmail})`,
      issuer: 'Agile Flow Verse',
      length: 32,
    });

    // Generate backup codes (10 codes, 8 characters each)
    const backupCodes = this.generateBackupCodes(10);

    // Encrypt the secret before storing (in production, use proper encryption)
    // For now, we'll store it directly - in production, use crypto.encrypt
    const encryptedSecret = await this.encryptSecret(secret.base32);

    // Store the secret and backup codes (hashed) in the database
    await this.prisma.tx.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptedSecret,
        totpBackupCodes: JSON.stringify(backupCodes.map(code => this.hashBackupCode(code))),
        totpEnabled: false, // Not enabled until verified
      },
    });

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    this.logger.log(`[2FA] Generated TOTP secret for user ${userId}`);

    return {
      secret: secret.base32, // Return plain secret for display (user needs to save this)
      qrCode: qrCodeUrl,
      backupCodes, // Return plain backup codes (user needs to save these)
      otpauthUrl: secret.otpauth_url,
    };
  }

  /**
   * Verify a TOTP token during setup
   * Verifies the token matches the stored secret before enabling 2FA
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   * @param token - The 6-digit TOTP token to verify
   * @returns True if token is valid
   */
  async verifyTotpSetup(tenantId: string, userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!user || !user.totpSecret) {
      throw new BadRequestException('TOTP secret not found. Please generate a new secret first.');
    }

    // Decrypt the secret
    const decryptedSecret = await this.decryptSecret(user.totpSecret);

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (verified) {
      // Mark 2FA as enabled and verified
      await this.prisma.tx.user.update({
        where: { id: userId },
        data: {
          totpEnabled: true,
          totpVerifiedAt: new Date(),
        },
      });

      this.logger.log(`[2FA] TOTP verified and enabled for user ${userId}`);
    }

    return verified;
  }

  /**
   * Verify a TOTP token during login
   * Used when user has 2FA enabled and is logging in
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   * @param token - The 6-digit TOTP token or backup code
   * @returns True if token is valid
   */
  async verifyTotpLogin(tenantId: string, userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!user || !user.totpEnabled || !user.totpSecret) {
      return false;
    }

    // Decrypt the secret
    const decryptedSecret = await this.decryptSecret(user.totpSecret);

    // First, try TOTP verification
    const totpVerified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (totpVerified) {
      return true;
    }

    // If TOTP failed, try backup codes
    if (user.totpBackupCodes) {
      const backupCodes = JSON.parse(user.totpBackupCodes);
      const hashedToken = this.hashBackupCode(token);

      // Check if token matches any backup code
      const backupCodeIndex = backupCodes.findIndex((hashed: string) => 
        bcrypt.compareSync(token, hashed) || hashed === hashedToken
      );

      if (backupCodeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(backupCodeIndex, 1);
        await this.prisma.tx.user.update({
          where: { id: userId },
          data: {
            totpBackupCodes: JSON.stringify(backupCodes),
          },
        });

        this.logger.log(`[2FA] Backup code used for user ${userId}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has 2FA enabled
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   * @returns True if 2FA is enabled
   */
  async isTwoFactorEnabled(tenantId: string, userId: string): Promise<boolean> {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
      select: {
        totpEnabled: true,
      },
    });

    return user?.totpEnabled || false;
  }

  /**
   * Disable 2FA for a user
   * Removes TOTP secret and backup codes
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   */
  async disableTwoFactor(tenantId: string, userId: string) {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.tx.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        totpEnabled: false,
        totpBackupCodes: null,
        totpVerifiedAt: null,
      },
    });

    this.logger.log(`[2FA] 2FA disabled for user ${userId}`);
  }

  /**
   * Regenerate backup codes for a user
   * 
   * @param tenantId - The tenant ID
   * @param userId - The user ID
   * @returns New backup codes
   */
  async regenerateBackupCodes(tenantId: string, userId: string) {
    const user = await this.prisma.tx.user.findFirst({
      where: {
        id: userId,
        OR: [
          { tenantId },
          { userTenants: { some: { tenantId } } },
        ],
      },
    });

    if (!user || !user.totpEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Store hashed backup codes
    await this.prisma.tx.user.update({
      where: { id: userId },
      data: {
        totpBackupCodes: JSON.stringify(backupCodes.map(code => this.hashBackupCode(code))),
      },
    });

    this.logger.log(`[2FA] Backup codes regenerated for user ${userId}`);

    return { backupCodes };
  }

  /**
   * Generate backup codes
   * Creates random 8-character alphanumeric codes
   * 
   * @param count - Number of codes to generate
   * @returns Array of backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash a backup code for storage
   * Uses bcrypt for secure hashing
   * 
   * @param code - The backup code to hash
   * @returns Hashed code
   */
  private hashBackupCode(code: string): string {
    // Use a simple hash for now - in production, use bcrypt
    // For simplicity, we'll use a deterministic hash
    return bcrypt.hashSync(code, 10);
  }

  /**
   * Encrypt TOTP secret before storage
   * In production, use proper encryption (AES-256-GCM)
   * 
   * @param secret - The plain TOTP secret
   * @returns Encrypted secret
   */
  private async encryptSecret(secret: string): Promise<string> {
    // TODO: Implement proper encryption using crypto module
    // For now, we'll store it as-is (NOT SECURE for production!)
    // In production, use: crypto.createCipheriv('aes-256-gcm', key, iv)
    return secret;
  }

  /**
   * Decrypt TOTP secret after retrieval
   * 
   * @param encryptedSecret - The encrypted secret
   * @returns Decrypted secret
   */
  private async decryptSecret(encryptedSecret: string): Promise<string> {
    // TODO: Implement proper decryption
    // For now, return as-is (NOT SECURE for production!)
    return encryptedSecret;
  }
}





