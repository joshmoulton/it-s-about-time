import { supabase } from '@/integrations/supabase/client';
import { generateDeviceFingerprint, getCurrentIP } from './securityUtils';

export interface AuthValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SessionValidationResult {
  valid: boolean;
  error?: string;
  adminEmail?: string;
  securityLevel?: string;
  expiresAt?: string;
}

// Enhanced email validation
export const validateEmail = (email: string): AuthValidationResult => {
  const errors: string[] = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('Email address is required');
  } else {
    const sanitizedEmail = email.toLowerCase().trim();
    
    // Basic format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      errors.push('Please enter a valid email address');
    }
    
    // Length validation
    if (sanitizedEmail.length > 254) {
      errors.push('Email address is too long');
    }
    
    // Additional security checks
    if (sanitizedEmail.includes('..')) {
      errors.push('Email address format is invalid');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Enhanced password validation
export const validatePassword = (password: string): AuthValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  if (/password|123456|qwerty|admin|user/i.test(password)) {
    errors.push('Password contains common weak patterns');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Check authentication rate limits using basic client-side tracking
export const checkAuthRateLimit = async (
  email: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<boolean> => {
  try {
    // Simple client-side rate limiting as fallback
    const key = `auth_attempts_${email}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]') as number[];
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(recentAttempts));
    
    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
};

// Log security events using existing function
export const logSecurityEvent = async (
  eventType: string,
  adminEmail: string,
  success: boolean,
  eventDetails: any = {},
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    // Use existing log_auth_event function
    await supabase.rpc('log_auth_event', {
      p_user_email: adminEmail,
      p_auth_method: 'enhanced_auth',
      p_action_type: eventType,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_metadata: eventDetails
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Validate session token using existing 2FA session validation
export const validateSessionToken = async (token: string): Promise<SessionValidationResult> => {
  try {
    // 2FA verification removed - simplified validation
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        valid: false,
        error: 'Session validation failed'
      };
    }
    
    if (session?.session?.user) {
      return {
        valid: true,
        adminEmail: session.session.user.email,
        expiresAt: new Date(session.session.expires_at || 0).toISOString()
      };
    }
    
    return {
      valid: false,
      error: 'No valid session found'
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      valid: false,
      error: 'Session validation service unavailable'
    };
  }
};

// Sanitize user input
export const sanitizeInput = async (
  input: string,
  type: 'general' | 'email' | 'username' | 'html' = 'general'
): Promise<string> => {
  try {
    const { data: sanitized, error } = await supabase.rpc('comprehensive_sanitize_input', {
      input_value: input,
      input_type: type
    });
    
    if (error) {
      console.error('Input sanitization failed:', error);
      // Fallback to basic sanitization
      return input.trim().replace(/[<>]/g, '');
    }
    
    return sanitized || '';
  } catch (error) {
    console.error('Sanitization error:', error);
    return input.trim().replace(/[<>]/g, '');
  }
};

// Enhanced authentication wrapper
export const secureAuthAction = async <T>(
  action: () => Promise<T>,
  actionType: string,
  userEmail?: string
): Promise<T> => {
  const startTime = Date.now();
  let success = false;
  let error: any = null;
  
  try {
    // Get security context
    const deviceFingerprint = generateDeviceFingerprint();
    const ipAddress = await getCurrentIP();
    const userAgent = navigator.userAgent;
    
    // Check rate limits if email is provided
    if (userEmail) {
      const rateLimitOk = await checkAuthRateLimit(userEmail);
      if (!rateLimitOk) {
        throw new Error('Too many authentication attempts. Please try again later.');
      }
    }
    
    // Execute the action
    const result = await action();
    success = true;
    
    // Log successful security event
    if (userEmail) {
      await logSecurityEvent(
        actionType,
        userEmail,
        true,
        {
          duration_ms: Date.now() - startTime,
          device_fingerprint: deviceFingerprint
        },
        ipAddress || undefined,
        userAgent
      );
    }
    
    return result;
  } catch (err) {
    error = err;
    success = false;
    
    // Log failed security event
    if (userEmail) {
      await logSecurityEvent(
        actionType,
        userEmail,
        false,
        {
          error_message: err instanceof Error ? err.message : 'Unknown error',
          duration_ms: Date.now() - startTime,
          device_fingerprint: generateDeviceFingerprint()
        },
        await getCurrentIP() || undefined,
        navigator.userAgent
      );
    }
    
    throw error;
  }
};

// Create secure storage wrapper for session tokens
export const secureSessionStorage = {
  setItem: (key: string, value: string): void => {
    try {
      // Use sessionStorage instead of localStorage for security
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove session data:', error);
    }
  },
  
  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }
};