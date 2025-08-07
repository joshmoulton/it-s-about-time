// Enhanced security utilities building on existing validation
import { validateEmail, sanitizeInput, rateLimitCheck } from './securityValidation';

/**
 * Enhanced input validation with context-aware sanitization
 */
export interface ValidationContext {
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  operation?: string;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  securityWarnings: string[];
}

/**
 * Enhanced email validation with additional security checks
 */
export const validateEmailEnhanced = (email: string, context?: ValidationContext): ValidationResult => {
  const errors: string[] = [];
  const securityWarnings: string[] = [];
  
  // Use existing validation as base
  if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }
  
  // Additional security checks
  const sanitized = sanitizeInput(email);
  if (sanitized !== email) {
    securityWarnings.push('Email contained potentially malicious characters that were removed');
  }
  
  // Check for suspicious email patterns
  const suspiciousPatterns = [
    /test.*@.*test/i,
    /admin.*@.*admin/i,
    /root@/i,
    /noreply@.*noreply/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(email))) {
    securityWarnings.push('Email matches suspicious patterns');
  }
  
  // Rate limiting check if context provided
  if (context?.ipAddress) {
    const rateLimitKey = `email_validation_${context.ipAddress}`;
    if (!rateLimitCheck(rateLimitKey, 20, 60000)) { // 20 attempts per minute
      errors.push('Rate limit exceeded for email validation');
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors,
    securityWarnings
  };
};

/**
 * Enhanced password validation
 */
export const validatePasswordEnhanced = (password: string): ValidationResult => {
  const errors: string[] = [];
  const securityWarnings: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    securityWarnings.push('Password should contain special characters for better security');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password123', '12345678', 'qwerty123', 'admin123', 'password1'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    errors.push('Password contains common patterns that are easily guessed');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: password, // Don't sanitize passwords
    errors,
    securityWarnings
  };
};

/**
 * Enhanced rate limiting with progressive delays
 */
export class EnhancedRateLimit {
  private attempts = new Map<string, { count: number; firstAttempt: number; lastAttempt: number }>();
  
  checkLimit(
    key: string, 
    baseLimit: number = 10, 
    windowMs: number = 60000,
    progressiveDelay: boolean = true
  ): { allowed: boolean; retryAfter?: number; attempts: number } {
    const now = Date.now();
    const windowKey = `${key}_${Math.floor(now / windowMs)}`;
    
    // Clean up old entries
    this.cleanupOldEntries(windowMs);
    
    const current = this.attempts.get(windowKey) || { count: 0, firstAttempt: now, lastAttempt: now };
    
    // Check if within base limit
    if (current.count < baseLimit) {
      current.count++;
      current.lastAttempt = now;
      this.attempts.set(windowKey, current);
      return { allowed: true, attempts: current.count };
    }
    
    // Calculate progressive delay
    let retryAfter = 0;
    if (progressiveDelay) {
      const excessAttempts = current.count - baseLimit;
      retryAfter = Math.min(300000, 1000 * Math.pow(2, excessAttempts)); // Max 5 minutes
    }
    
    current.count++;
    current.lastAttempt = now;
    this.attempts.set(windowKey, current);
    
    return { 
      allowed: false, 
      retryAfter,
      attempts: current.count 
    };
  }
  
  private cleanupOldEntries(windowMs: number) {
    const now = Date.now();
    const cutoff = now - (windowMs * 2); // Keep entries for 2 windows
    
    for (const [key, data] of this.attempts.entries()) {
      if (data.lastAttempt < cutoff) {
        this.attempts.delete(key);
      }
    }
  }
  
  reset(key: string) {
    const keysToDelete = Array.from(this.attempts.keys()).filter(k => k.startsWith(key));
    keysToDelete.forEach(k => this.attempts.delete(k));
  }
}

/**
 * Content Security Policy helpers
 */
export const generateCSPHeader = (context: 'admin' | 'public' = 'public'): string => {
  const basePolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https://wrvvlmevpvcenauglcyz.supabase.co",
    "frame-src 'self' https://www.youtube.com https://youtube.com",
    "object-src 'none'",
    "base-uri 'self'"
  ];
  
  if (context === 'admin') {
    // More restrictive for admin panel
    basePolicy[1] = "script-src 'self'"; // No unsafe-inline for admin
    basePolicy.push("frame-ancestors 'none'"); // Prevent clickjacking
  }
  
  return basePolicy.join('; ');
};

/**
 * Security headers for edge functions
 */
export const getSecurityHeaders = (context: 'admin' | 'public' = 'public') => {
  return {
    'Content-Security-Policy': generateCSPHeader(context),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': context === 'admin' ? 'DENY' : 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
};

// Global rate limiter instance
export const globalRateLimit = new EnhancedRateLimit();