// Request validation utilities for API security
import { z } from 'zod';
import { logger } from './secureLogger';
import { maskEmail } from './dataMasking';

export interface ValidationContext {
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  sanitizedData?: any;
  securityWarnings?: string[];
}

class RequestValidator {
  private static instance: RequestValidator;
  private schemas = new Map<string, z.ZodSchema>();
  private customValidators = new Map<string, (data: any, context?: ValidationContext) => ValidationResult>();

  static getInstance(): RequestValidator {
    if (!RequestValidator.instance) {
      RequestValidator.instance = new RequestValidator();
    }
    return RequestValidator.instance;
  }

  /**
   * Register a Zod schema for an endpoint
   */
  registerSchema(endpoint: string, schema: z.ZodSchema): void {
    this.schemas.set(endpoint, schema);
    logger.info('Validation schema registered', { endpoint });
  }

  /**
   * Register a custom validator function
   */
  registerCustomValidator(
    endpoint: string, 
    validator: (data: any, context?: ValidationContext) => ValidationResult
  ): void {
    this.customValidators.set(endpoint, validator);
    logger.info('Custom validator registered', { endpoint });
  }

  /**
   * Validate request data
   */
  validate(endpoint: string, data: any, context?: ValidationContext): ValidationResult {
    const schema = this.schemas.get(endpoint);
    const customValidator = this.customValidators.get(endpoint);
    
    let result: ValidationResult = { isValid: true };
    let securityWarnings: string[] = [];

    // Run Zod schema validation
    if (schema) {
      try {
        const validatedData = schema.parse(data);
        result.sanitizedData = validatedData;
      } catch (error) {
        if (error instanceof z.ZodError) {
          result.isValid = false;
          result.errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        } else {
          result.isValid = false;
          result.errors = ['Validation error occurred'];
        }

        logger.warn('Schema validation failed', {
          endpoint,
          errors: result.errors,
          userEmail: context?.userEmail ? maskEmail(context.userEmail) : undefined
        });
      }
    }

    // Run custom validation
    if (customValidator && result.isValid) {
      const customResult = customValidator(result.sanitizedData || data, context);
      if (!customResult.isValid) {
        result = customResult;
      } else {
        securityWarnings.push(...(customResult.securityWarnings || []));
      }
    }

    // Security checks
    securityWarnings.push(...this.performSecurityChecks(data, context));

    if (securityWarnings.length > 0) {
      result.securityWarnings = securityWarnings;
      logger.warn('Security warnings detected', {
        endpoint,
        warnings: securityWarnings,
        userEmail: context?.userEmail ? maskEmail(context.userEmail) : undefined
      });
    }

    return result;
  }

  /**
   * Perform general security checks
   */
  private performSecurityChecks(data: any, context?: ValidationContext): string[] {
    const warnings: string[] = [];

    // Check for potential SQL injection patterns
    if (typeof data === 'object') {
      const dataStr = JSON.stringify(data).toLowerCase();
      const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+.+set/i,
        /exec\s*\(/i,
        /script\s*>/i
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(dataStr)) {
          warnings.push('Potential SQL injection pattern detected');
          break;
        }
      }
    }

    // Check for XSS patterns
    if (typeof data === 'string' || (typeof data === 'object' && data !== null)) {
      const checkString = typeof data === 'string' ? data : JSON.stringify(data);
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>/gi
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(checkString)) {
          warnings.push('Potential XSS pattern detected');
          break;
        }
      }
    }

    // Check for suspicious request frequency (if context provided)
    if (context?.timestamp && context?.userEmail) {
      // This could be enhanced with actual frequency tracking
      const now = new Date().getTime();
      const requestTime = new Date(context.timestamp).getTime();
      const timeDiff = now - requestTime;

      if (timeDiff < 100) { // Less than 100ms - potentially automated
        warnings.push('Unusually fast request detected');
      }
    }

    return warnings;
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Sanitize key names
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        sanitized[cleanKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }
}

// Global instance
export const requestValidator = RequestValidator.getInstance();

// Common validation schemas
export const commonSchemas = {
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  uuid: z.string().uuid(),
  role: z.enum(['user', 'admin', 'super_admin', 'moderator', 'editor']),
  subscriptionTier: z.enum(['free', 'paid', 'premium']),
  paginationParams: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    search: z.string().max(100).optional()
  })
};

// Admin user schemas
requestValidator.registerSchema('admin_user_create', z.object({
  email: commonSchemas.email,
  role: commonSchemas.role,
  password: commonSchemas.password.optional()
}));

requestValidator.registerSchema('admin_user_update', z.object({
  id: commonSchemas.uuid,
  role: commonSchemas.role.optional(),
  is_active: z.boolean().optional()
}));

requestValidator.registerSchema('user_list', z.object({
  ...commonSchemas.paginationParams.shape,
  tierFilter: commonSchemas.subscriptionTier.optional(),
  userType: z.string().optional()
}));

// Data export schemas
requestValidator.registerSchema('data_export', z.object({
  table: z.string().max(50),
  format: z.enum(['csv', 'json']),
  filters: z.object({}).optional(),
  limit: z.number().int().min(1).max(10000).optional()
}));

// Custom validators for security-sensitive operations
requestValidator.registerCustomValidator('admin_user_create', (data, context) => {
  const warnings: string[] = [];
  
  // Check for admin creation outside business hours
  const now = new Date();
  const hour = now.getHours();
  if (hour < 9 || hour > 17) {
    warnings.push('Admin user creation outside business hours');
  }

  // Check if email domain is suspicious
  if (data.email) {
    const domain = data.email.split('@')[1];
    const suspiciousDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    if (suspiciousDomains.includes(domain)) {
      return {
        isValid: false,
        errors: ['Temporary email domains not allowed for admin accounts'],
        securityWarnings: warnings
      };
    }
  }

  return { isValid: true, securityWarnings: warnings };
});

requestValidator.registerCustomValidator('user_list', (data, context) => {
  const warnings: string[] = [];
  
  // Large data exports should be flagged
  if (data.limit && data.limit > 1000) {
    warnings.push('Large data export requested');
  }

  // Frequent pagination requests
  if (data.page && data.page > 100) {
    warnings.push('Deep pagination detected - potential data scraping');
  }

  return { isValid: true, securityWarnings: warnings };
});

/**
 * Validation middleware function
 */
export const withValidation = (
  endpoint: string,
  data: any,
  context?: ValidationContext,
  operation?: () => Promise<any>
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const validation = requestValidator.validate(endpoint, data, context);
    
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      (error as any).status = 400;
      (error as any).validationErrors = validation.errors;
      
      reject(error);
      return;
    }

    if (validation.securityWarnings && validation.securityWarnings.length > 0) {
      // Log security warnings but don't block the request
      logger.warn('Request validation warnings', {
        endpoint,
        warnings: validation.securityWarnings,
        userEmail: context?.userEmail ? maskEmail(context.userEmail) : undefined
      });
    }

    if (operation) {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    } else {
      resolve(validation.sanitizedData || data);
    }
  });
};