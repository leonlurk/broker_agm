/**
 * Two-Factor Authentication Service
 * Handles 2FA setup, verification, and management
 */

import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';
import emailService from './emailService';

class TwoFactorService {
  constructor() {
    this.tableStructure = null;
    this.emailCodes = new Map(); // Store temporary email codes
  }

  /**
   * Check and cache table structure
   * @returns {Promise<Object>} Table structure info
   */
  async checkTableStructure() {
    if (this.tableStructure) return this.tableStructure;
    
    try {
      // Try to get one record to see what columns exist
      const { data, error } = await supabase
        .from('user_2fa')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        // If error is not "no rows found", log it
        logger.error('[2FA] Error checking table structure:', error);
        // Set actual structure
        this.tableStructure = {
          enabledColumn: 'is_enabled',
          secretColumn: 'secret_key',
          backupCodesColumn: 'backup_codes',
          enabledAtColumn: 'enabled_at',
          lastUsedAtColumn: 'last_used_at',
          updatedAtColumn: 'updated_at'
        };
        return this.tableStructure;
      }
      
      // Table exists, use actual column names from your schema
      this.tableStructure = {
        enabledColumn: 'is_enabled',
        secretColumn: 'secret_key',
        backupCodesColumn: 'backup_codes',
        enabledAtColumn: 'enabled_at',
        lastUsedAtColumn: 'last_used_at',
        updatedAtColumn: 'updated_at'
      };
      
      logger.info('[2FA] Table structure determined:', this.tableStructure);
      return this.tableStructure;
    } catch (err) {
      logger.error('[2FA] Error determining table structure:', err);
      // Fallback to actual structure
      this.tableStructure = {
        enabledColumn: 'is_enabled',
        secretColumn: 'secret_key',
        backupCodesColumn: 'backup_codes',
        enabledAtColumn: 'enabled_at',
        lastUsedAtColumn: 'last_used_at',
        updatedAtColumn: 'updated_at'
      };
      return this.tableStructure;
    }
  }
  /**
   * Generate a new 2FA secret for a user
   * @param {string} userEmail - User's email address
   * @returns {Promise<{secret: string, qrCode: string, backupCodes: string[]}>}
   */
  async generateSecret(userEmail) {
    try {
      // Generate a random secret
      const secret = OTPAuth.Secret.fromBase32(
        this.generateRandomBase32()
      );

      // Create TOTP instance
      const totp = new OTPAuth.TOTP({
        issuer: 'Alpha Global Market',
        label: userEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });

      // Generate QR code
      const otpauthUrl = totp.toString();
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      logger.info('[2FA] Secret generated for user:', userEmail);

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes,
        otpauth_url: otpauthUrl
      };
    } catch (error) {
      logger.error('[2FA] Error generating secret:', error);
      throw error;
    }
  }

  /**
   * Generate a random base32 secret
   * @returns {string} Base32 encoded secret
   */
  generateRandomBase32() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  /**
   * Generate backup codes
   * @returns {string[]} Array of 8 backup codes
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify a TOTP token
   * @param {string} token - The 6-digit token from the user
   * @param {string} secretBase32 - The user's secret key in base32
   * @param {string} userId - User ID (optional, for updating last_used_at)
   * @returns {boolean} Whether the token is valid
   */
  async verifyToken(token, secretBase32, userId = null) {
    try {
      // Create secret from base32
      const secret = OTPAuth.Secret.fromBase32(secretBase32);
      
      // Create TOTP instance
      const totp = new OTPAuth.TOTP({
        issuer: 'Alpha Global Market',
        label: 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });

      // Validate the token (with window of 1 for clock skew)
      const delta = totp.validate({ token, window: 1 });
      const verified = delta !== null;

      // If verified and userId provided, update last_used_at
      if (verified && userId) {
        try {
          await this.checkTableStructure();
          const structure = this.tableStructure;
          
          await supabase
            .from('user_2fa')
            .update({
              [structure.lastUsedAtColumn]: new Date().toISOString(),
              [structure.updatedAtColumn]: new Date().toISOString()
            })
            .eq('user_id', userId);
        } catch (updateError) {
          logger.error('[2FA] Error updating last_used_at:', updateError);
          // Don't fail verification if we can't update timestamp
        }
      }

      logger.info('[2FA] Token verification result:', verified);
      return verified;
    } catch (error) {
      logger.error('[2FA] Error verifying token:', error);
      return false;
    }
  }

  /**
   * Enable 2FA for a user (both app and email)
   * @param {string} userId - User ID
   * @param {string} secret - The verified secret
   * @param {string[]} backupCodes - Backup codes
   * @returns {Promise<{success: boolean}>}
   */
  async enable2FA(userId, secret, backupCodes) {
    try {
      await this.checkTableStructure();
      const structure = this.tableStructure;
      
      // Store 2FA data in database with both methods enabled
      const now = new Date().toISOString();
      const dataToInsert = {
        user_id: userId,
        [structure.secretColumn]: secret,
        [structure.backupCodesColumn]: backupCodes,
        [structure.enabledColumn]: true,
        two_fa_method: 'both', // Changed from 'app' or 'email' to 'both'
        app_2fa_enabled: true,  // Track app method separately
        email_2fa_enabled: true, // Track email method separately
        [structure.enabledAtColumn]: now,
        [structure.updatedAtColumn]: now,
        created_at: now
      };
      
      const { error } = await supabase
        .from('user_2fa')
        .upsert(dataToInsert);

      if (error) {
        logger.error('[2FA] Error enabling dual 2FA:', error);
        return { success: false, error: error.message };
      }

      // Update user's 2FA status
      const { error: userError } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('id', userId);

      if (userError) {
        logger.error('[2FA] Error updating user status:', userError);
        return { success: false, error: userError.message };
      }

      logger.info('[2FA] Dual 2FA (app + email) enabled for user:', userId);
      return { success: true };
    } catch (error) {
      logger.error('[2FA] Error enabling dual 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disable 2FA for a user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>}
   */
  async disable2FA(userId) {
    try {
      await this.checkTableStructure();
      const structure = this.tableStructure;
      
      const updateData = {
        [structure.enabledColumn]: false,
        [structure.enabledAtColumn]: null,
        [structure.updatedAtColumn]: new Date().toISOString()
      };
      
      // Update 2FA status
      const { error } = await supabase
        .from('user_2fa')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        logger.error('[2FA] Error disabling 2FA:', error);
        return { success: false, error: error.message };
      }

      // Update user's 2FA status
      const { error: userError } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: false })
        .eq('id', userId);

      if (userError) {
        logger.error('[2FA] Error updating user status:', userError);
        return { success: false, error: userError.message };
      }

      logger.info('[2FA] 2FA disabled for user:', userId);
      return { success: true };
    } catch (error) {
      logger.error('[2FA] Error disabling 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get 2FA status for a user
   * @param {string} userId - User ID
   * @returns {Promise<{enabled: boolean, secret?: string}>}
   */
  async get2FAStatus(userId) {
    try {
      await this.checkTableStructure();
      const structure = this.tableStructure;
      
      const { data, error } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No 2FA record found
          return { enabled: false };
        }
        throw error;
      }

      return {
        enabled: data[structure.enabledColumn] || false,
        secret: data[structure.secretColumn]
      };
    } catch (error) {
      logger.error('[2FA] Error getting 2FA status:', error);
      return { enabled: false };
    }
  }

  /**
   * Verify a backup code
   * @param {string} userId - User ID
   * @param {string} code - Backup code to verify
   * @returns {Promise<boolean>}
   */
  async verifyBackupCode(userId, code) {
    try {
      await this.checkTableStructure();
      const structure = this.tableStructure;
      
      const { data, error } = await supabase
        .from('user_2fa')
        .select(structure.backupCodesColumn)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      const backupCodes = data[structure.backupCodesColumn] || [];
      const codeIndex = backupCodes.indexOf(code.toUpperCase());

      if (codeIndex === -1) {
        return false;
      }

      // Remove used backup code
      backupCodes.splice(codeIndex, 1);

      // Update backup codes in database
      await supabase
        .from('user_2fa')
        .update({ 
          [structure.backupCodesColumn]: backupCodes,
          [structure.lastUsedAtColumn]: new Date().toISOString(),
          [structure.updatedAtColumn]: new Date().toISOString()
        })
        .eq('user_id', userId);

      logger.info('[2FA] Backup code used for user:', userId);
      return true;
    } catch (error) {
      logger.error('[2FA] Error verifying backup code:', error);
      return false;
    }
  }

  /**
   * Generate and send 2FA code via email
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async sendEmailCode(userId, userEmail, userName) {
    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code with expiration (10 minutes)
      const expiration = Date.now() + 10 * 60 * 1000;
      this.emailCodes.set(userId, { code, expiration, attempts: 0 });
      
      // Send email
      const result = await emailService.send2FACode(
        { email: userEmail, name: userName },
        code
      );
      
      if (result.success) {
        logger.info('[2FA] Email code sent to:', userEmail);
        return { success: true, message: 'Código enviado por email' };
      } else {
        logger.error('[2FA] Failed to send email code:', result.error);
        return { success: false, message: 'Error al enviar el código por email' };
      }
    } catch (error) {
      logger.error('[2FA] Error sending email code:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Verify email 2FA code
   * @param {string} userId - User ID
   * @param {string} code - Verification code
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async verifyEmailCode(userId, code) {
    try {
      const storedData = this.emailCodes.get(userId);
      
      if (!storedData) {
        return { success: false, message: 'No hay código pendiente de verificación' };
      }
      
      // Check expiration
      if (Date.now() > storedData.expiration) {
        this.emailCodes.delete(userId);
        return { success: false, message: 'El código ha expirado' };
      }
      
      // Check attempts (max 3)
      if (storedData.attempts >= 3) {
        this.emailCodes.delete(userId);
        return { success: false, message: 'Demasiados intentos fallidos' };
      }
      
      // Verify code
      if (storedData.code === code) {
        this.emailCodes.delete(userId);
        
        // Update last used timestamp
        await this.checkTableStructure();
        const structure = this.tableStructure;
        
        await supabase
          .from('user_2fa')
          .update({
            [structure.lastUsedAtColumn]: new Date().toISOString(),
            [structure.updatedAtColumn]: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        return { success: true, message: 'Código verificado correctamente' };
      } else {
        // Increment attempts
        storedData.attempts++;
        this.emailCodes.set(userId, storedData);
        return { success: false, message: `Código incorrecto. Intentos restantes: ${3 - storedData.attempts}` };
      }
    } catch (error) {
      logger.error('[2FA] Error verifying email code:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Enable email 2FA for a user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>}
   */
  async enableEmail2FA(userId) {
    try {
      await this.checkTableStructure();
      const structure = this.tableStructure;
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const twoFAData = {
        user_id: userId,
        [structure.enabledColumn]: true,
        two_fa_method: 'email', // Add this field to track the method
        [structure.enabledAtColumn]: new Date().toISOString(),
        [structure.updatedAtColumn]: new Date().toISOString()
      };
      
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_2fa')
          .update(twoFAData)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_2fa')
          .insert(twoFAData);
        
        if (error) throw error;
      }
      
      // Update user's 2FA status
      const { error: userError } = await supabase
        .from('profiles')
        .update({ 
          two_factor_enabled: true,
          two_factor_method: 'email'
        })
        .eq('id', userId);
      
      if (userError) {
        logger.error('[2FA] Error updating user status:', userError);
        return { success: false, error: userError.message };
      }
      
      logger.info('[2FA] Email 2FA enabled for user:', userId);
      return { success: true };
    } catch (error) {
      logger.error('[2FA] Error enabling email 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's 2FA method
   * @param {string} userId - User ID
   * @returns {Promise<{method: string|null}>}
   */
  async get2FAMethod(userId) {
    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('two_fa_method, app_2fa_enabled, email_2fa_enabled')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        return { method: null };
      }
      
      // Return 'both' for dual authentication
      if (data.two_fa_method === 'both' || (data.app_2fa_enabled && data.email_2fa_enabled)) {
        return { method: 'both', app: true, email: true };
      }
      
      // Legacy support for single methods
      return { method: data.two_fa_method || 'authenticator' };
    } catch (error) {
      logger.error('[2FA] Error getting 2FA method:', error);
      return { method: null };
    }
  }
}

// Export singleton instance
const twoFactorService = new TwoFactorService();
export default twoFactorService;