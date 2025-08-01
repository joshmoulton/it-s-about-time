// Enhanced admin security utilities
import { supabase } from '@/integrations/supabase/client';
import { logger } from './secureLogger';
import { maskEmail } from './dataMasking';

export interface AdminSession {
  startTime: number;
  lastActivity: number;
  isElevated: boolean;
  elevatedUntil?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminAuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

class AdminSecurityManager {
  private sessions = new Map<string, AdminSession>();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly ELEVATED_TIMEOUT = 10 * 60 * 1000; // 10 minutes for elevated operations
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  
  private loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  /**
   * Initialize admin session with security tracking
   */
  initializeSession(userEmail: string, ipAddress?: string, userAgent?: string): void {
    const session: AdminSession = {
      startTime: Date.now(),
      lastActivity: Date.now(),
      isElevated: false,
      ipAddress,
      userAgent
    };
    
    this.sessions.set(userEmail, session);
    this.auditLog('session_start', 'admin_session', undefined, { ipAddress, userAgent });
    
    logger.secureLog('info', 'Admin session initialized', {
      email: maskEmail(userEmail),
      ipAddress,
      userAgent
    });
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(userEmail: string): void {
    const session = this.sessions.get(userEmail);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Check if session is valid and not timed out
   */
  isSessionValid(userEmail: string): boolean {
    const session = this.sessions.get(userEmail);
    if (!session) return false;
    
    const now = Date.now();
    const isValid = (now - session.lastActivity) < this.SESSION_TIMEOUT;
    
    if (!isValid) {
      this.terminateSession(userEmail, 'timeout');
    }
    
    return isValid;
  }

  /**
   * Elevate permissions for sensitive operations
   */
  async elevatePermissions(userEmail: string, password: string): Promise<boolean> {
    try {
      // Re-authenticate user for elevated permissions
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });

      if (error) {
        this.auditLog('elevation_failed', 'admin_session', undefined, { 
          reason: 'authentication_failed' 
        });
        return false;
      }

      const session = this.sessions.get(userEmail);
      if (session) {
        session.isElevated = true;
        session.elevatedUntil = Date.now() + this.ELEVATED_TIMEOUT;
        
        this.auditLog('elevation_granted', 'admin_session');
        logger.secureLog('info', 'Admin permissions elevated', {
          email: maskEmail(userEmail)
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to elevate permissions:', error);
      return false;
    }
  }

  /**
   * Check if user has elevated permissions
   */
  hasElevatedPermissions(userEmail: string): boolean {
    const session = this.sessions.get(userEmail);
    if (!session || !session.isElevated) return false;
    
    const now = Date.now();
    if (session.elevatedUntil && now > session.elevatedUntil) {
      session.isElevated = false;
      session.elevatedUntil = undefined;
      this.auditLog('elevation_expired', 'admin_session');
      return false;
    }
    
    return true;
  }

  /**
   * Terminate admin session
   */
  terminateSession(userEmail: string, reason: string = 'manual'): void {
    this.sessions.delete(userEmail);
    this.auditLog('session_end', 'admin_session', undefined, { reason });
    
    logger.secureLog('info', 'Admin session terminated', {
      email: maskEmail(userEmail),
      reason
    });
  }

  /**
   * Record login attempt and check for brute force
   */
  recordLoginAttempt(email: string, success: boolean): boolean {
    const now = Date.now();
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    // Reset counter if last attempt was more than lockout duration ago
    if (now - attempts.lastAttempt > this.LOCKOUT_DURATION) {
      attempts.count = 0;
    }
    
    if (success) {
      this.loginAttempts.delete(email);
      return true;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    this.loginAttempts.set(email, attempts);
    
    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      this.auditLog('account_locked', 'admin_account', undefined, {
        email: maskEmail(email),
        attemptCount: attempts.count
      });
      return false;
    }
    
    return true;
  }

  /**
   * Check if account is locked due to failed attempts
   */
  isAccountLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;
    
    const now = Date.now();
    const isLocked = attempts.count >= this.MAX_LOGIN_ATTEMPTS && 
                    (now - attempts.lastAttempt) < this.LOCKOUT_DURATION;
    
    return isLocked;
  }

  /**
   * Log admin audit events
   */
  async auditLog(action: string, resource: string, resourceId?: string, metadata?: any): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditEvent = {
        action,
        resource,
        resource_id: resourceId,
        user_email: user?.email || 'unknown',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          session_id: user?.id
        },
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent
      };

      // Store in dedicated audit table (you may need to create this)
      await supabase.from('admin_audit_log').insert(auditEvent);
      
      logger.secureLog('info', 'Admin audit event', auditEvent);
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Require re-authentication for sensitive operations
   */
  async requireReAuthentication(userEmail: string, sensitiveAction: string): Promise<boolean> {
    if (this.hasElevatedPermissions(userEmail)) {
      return true;
    }
    
    this.auditLog('reauthentication_required', 'admin_session', undefined, {
      action: sensitiveAction
    });
    
    // In a real implementation, this would trigger a modal for password entry
    return false;
  }

  /**
   * Get session info for display
   */
  getSessionInfo(userEmail: string): AdminSession | null {
    return this.sessions.get(userEmail) || null;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [email, session] of this.sessions.entries()) {
      if ((now - session.lastActivity) > this.SESSION_TIMEOUT) {
        this.terminateSession(email, 'cleanup');
      }
    }
  }
}

// Global instance
export const adminSecurityManager = new AdminSecurityManager();

// Auto-cleanup expired sessions every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    adminSecurityManager.cleanupExpiredSessions();
  }, 5 * 60 * 1000);
}

/**
 * Higher-order component to protect sensitive admin operations
 */
export function requireElevatedPermissions(action: string) {
  return function<T extends any[]>(
    target: (...args: T) => Promise<any>,
    context: ClassMethodDecoratorContext
  ) {
    return async function(this: any, ...args: T) {
      const user = await supabase.auth.getUser();
      const userEmail = user.data.user?.email;
      
      if (!userEmail) {
        throw new Error('No authenticated user');
      }
      
      const hasPermission = await adminSecurityManager.requireReAuthentication(userEmail, action);
      if (!hasPermission) {
        throw new Error('Elevated permissions required');
      }
      
      return target.apply(this, args);
    };
  };
}

/**
 * Validate admin operations based on role permissions
 */
export const validateAdminOperation = (
  operation: string,
  userRole: string,
  targetResource: string
): boolean => {
  const permissions = {
    super_admin: ['*'], // All operations
    admin: [
      'user_view', 'user_edit', 'user_delete',
      'content_create', 'content_edit', 'content_delete',
      'settings_view', 'settings_edit'
    ],
    editor: [
      'user_view', 'content_create', 'content_edit',
      'settings_view'
    ],
    moderator: [
      'user_view', 'content_view', 'content_edit',
      'settings_view'
    ]
  };
  
  const userPermissions = permissions[userRole as keyof typeof permissions] || [];
  
  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Check specific permission
  const requiredPermission = `${targetResource}_${operation}`;
  return userPermissions.includes(requiredPermission);
};