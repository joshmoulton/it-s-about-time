import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface DeviceFingerprint {
  userAgent: string;
  language: string;
  timezone: string;
  screen: string;
  timestamp: number;
}

export class TwoFactorAuthManager {
  private static generateSecret(): string {
    return authenticator.generateSecret();
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  static async setupTwoFactor(adminEmail: string, serviceName: string = 'Weekly Wizdom Admin'): Promise<TwoFactorSetup> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    
    // Generate QR code URL
    const otpAuthUrl = authenticator.keyuri(adminEmail, serviceName, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    // Store secret in database (disabled by default)
    const { error } = await supabase
      .from('admin_2fa_secrets')
      .upsert({
        admin_email: adminEmail,
        secret_key: secret,
        backup_codes: backupCodes,
        is_enabled: false,
        device_fingerprints: []
      });

    if (error) {
      throw new Error(`Failed to setup 2FA: ${error.message}`);
    }

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  static verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  static async enableTwoFactor(adminEmail: string, verificationToken: string): Promise<boolean> {
    // Get stored secret
    const { data: secretData, error } = await supabase
      .from('admin_2fa_secrets')
      .select('secret_key')
      .eq('admin_email', adminEmail)
      .single();

    if (error || !secretData) {
      throw new Error('2FA setup not found');
    }

    // Verify token
    const isValid = this.verifyToken(secretData.secret_key, verificationToken);
    
    if (!isValid) {
      return false;
    }

    // Enable 2FA
    const { error: updateError } = await supabase
      .from('admin_2fa_secrets')
      .update({ 
        is_enabled: true,
        last_used_at: new Date().toISOString()
      })
      .eq('admin_email', adminEmail);

    if (updateError) {
      throw new Error(`Failed to enable 2FA: ${updateError.message}`);
    }

    // Update admin user record
    await supabase
      .from('admin_users')
      .update({ 
        last_2fa_setup_at: new Date().toISOString(),
        failed_2fa_attempts: 0
      })
      .eq('email', adminEmail);

    // Log security event
    await this.logSecurityEvent(adminEmail, '2fa_setup', { success: true });

    return true;
  }

  static async verifyTwoFactor(adminEmail: string, token: string): Promise<boolean> {
    // Get stored secret
    const { data: secretData, error } = await supabase
      .from('admin_2fa_secrets')
      .select('*')
      .eq('admin_email', adminEmail)
      .eq('is_enabled', true)
      .single();

    if (error || !secretData) {
      return false;
    }

    // Check if token is a backup code
    if (secretData.backup_codes?.includes(token.toUpperCase())) {
      // Remove used backup code
      const updatedCodes = secretData.backup_codes.filter(code => code !== token.toUpperCase());
      
      await supabase
        .from('admin_2fa_secrets')
        .update({ 
          backup_codes: updatedCodes,
          last_used_at: new Date().toISOString()
        })
        .eq('admin_email', adminEmail);

      await this.logSecurityEvent(adminEmail, '2fa_verify', { method: 'backup_code', success: true });
      return true;
    }

    // Verify TOTP token
    const isValid = this.verifyToken(secretData.secret_key, token);
    
    if (isValid) {
      // Update last used timestamp
      await supabase
        .from('admin_2fa_secrets')
        .update({ last_used_at: new Date().toISOString() })
        .eq('admin_email', adminEmail);

      // Reset failed attempts
      await supabase
        .from('admin_users')
        .update({ failed_2fa_attempts: 0 })
        .eq('email', adminEmail);

      await this.logSecurityEvent(adminEmail, '2fa_verify', { method: 'totp', success: true });
    } else {
      // Increment failed attempts
      const { data: currentAdmin } = await supabase
        .from('admin_users')
        .select('failed_2fa_attempts')
        .eq('email', adminEmail)
        .single();

      const newFailedAttempts = (currentAdmin?.failed_2fa_attempts || 0) + 1;
      
      await supabase
        .from('admin_users')
        .update({ failed_2fa_attempts: newFailedAttempts })
        .eq('email', adminEmail);

      await this.logSecurityEvent(adminEmail, 'failed_2fa', { method: 'totp', success: false });
    }

    return isValid;
  }

  static async createSecureSession(adminEmail: string, expiresMinutes: number = 15): Promise<string> {
    const deviceFingerprint = this.generateDeviceFingerprint();
    
    const { data, error } = await supabase.rpc('create_2fa_session', {
      p_admin_email: adminEmail,
      p_expires_minutes: expiresMinutes,
      p_ip_address: await this.getClientIP(),
      p_user_agent: navigator.userAgent,
      p_device_fingerprint: JSON.stringify(deviceFingerprint)
    });

    if (error) {
      throw new Error(`Failed to create secure session: ${error.message}`);
    }

    return data;
  }

  static async verifySecureSession(sessionToken: string): Promise<{ valid: boolean; adminEmail?: string }> {
    const { data, error } = await supabase.rpc('verify_2fa_session', {
      p_session_token: sessionToken
    });

    if (error) {
      return { valid: false };
    }

    return {
      valid: (data as any).valid,
      adminEmail: (data as any).admin_email
    };
  }

  static async markSessionVerified(sessionToken: string): Promise<void> {
    await supabase
      .from('admin_2fa_sessions')
      .update({ verified_at: new Date().toISOString() })
      .eq('session_token', sessionToken);
  }

  static generateDeviceFingerprint(): DeviceFingerprint {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      timestamp: Date.now()
    };
  }

  static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  static async logSecurityEvent(
    adminEmail: string,
    eventType: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const deviceFingerprint = this.generateDeviceFingerprint();
    
    await supabase.rpc('log_admin_security_event', {
      p_admin_email: adminEmail,
      p_event_type: eventType,
      p_event_details: details,
      p_ip_address: await this.getClientIP(),
      p_user_agent: navigator.userAgent,
      p_device_fingerprint: JSON.stringify(deviceFingerprint),
      p_success: details.success || false
    });
  }

  static async checkAdminHas2FAEnabled(adminEmail: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admin_2fa_secrets')
      .select('is_enabled')
      .eq('admin_email', adminEmail)
      .eq('is_enabled', true)
      .single();

    return !error && !!data;
  }

  static async getTwoFactorStatus(adminEmail: string): Promise<{
    enabled: boolean;
    lastUsed?: string;
    backupCodesRemaining?: number;
  }> {
    const { data, error } = await supabase
      .from('admin_2fa_secrets')
      .select('is_enabled, last_used_at, backup_codes')
      .eq('admin_email', adminEmail)
      .single();

    if (error || !data) {
      return { enabled: false };
    }

    return {
      enabled: data.is_enabled,
      lastUsed: data.last_used_at,
      backupCodesRemaining: data.backup_codes?.length || 0
    };
  }

  static async disableTwoFactor(adminEmail: string, confirmationToken: string): Promise<boolean> {
    // Verify current token before disabling
    const isValid = await this.verifyTwoFactor(adminEmail, confirmationToken);
    
    if (!isValid) {
      return false;
    }

    // Disable 2FA
    const { error } = await supabase
      .from('admin_2fa_secrets')
      .update({ is_enabled: false })
      .eq('admin_email', adminEmail);

    if (error) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }

    // Log security event
    await this.logSecurityEvent(adminEmail, '2fa_disabled', { success: true });

    return true;
  }

  static async regenerateBackupCodes(adminEmail: string, verificationToken: string): Promise<string[]> {
    // Verify token first
    const isValid = await this.verifyTwoFactor(adminEmail, verificationToken);
    
    if (!isValid) {
      throw new Error('Invalid verification token');
    }

    const newBackupCodes = this.generateBackupCodes();

    const { error } = await supabase
      .from('admin_2fa_secrets')
      .update({ backup_codes: newBackupCodes })
      .eq('admin_email', adminEmail);

    if (error) {
      throw new Error(`Failed to regenerate backup codes: ${error.message}`);
    }

    await this.logSecurityEvent(adminEmail, 'backup_codes_regenerated', { success: true });

    return newBackupCodes;
  }
}

// Session storage for 2FA tokens
export class TwoFactorSession {
  private static readonly SESSION_KEY = 'admin_2fa_session';
  private static readonly VERIFICATION_KEY = 'admin_2fa_verified';

  static storeSession(sessionToken: string): void {
    localStorage.setItem(this.SESSION_KEY, sessionToken);
  }

  static getSession(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.VERIFICATION_KEY);
  }

  static markVerified(): void {
    localStorage.setItem(this.VERIFICATION_KEY, Date.now().toString());
  }

  static isRecentlyVerified(maxAgeMinutes: number = 15): boolean {
    const verifiedTime = localStorage.getItem(this.VERIFICATION_KEY);
    if (!verifiedTime) return false;

    const age = Date.now() - parseInt(verifiedTime);
    return age < maxAgeMinutes * 60 * 1000;
  }
}