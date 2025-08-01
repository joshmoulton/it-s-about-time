import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/secureLogger';
import { rateLimiter, withRateLimit } from '@/utils/rateLimiting';
import { requestValidator, withValidation } from '@/utils/requestValidation';
import { enhancedRLSCheck } from '@/utils/enhancedRLS';
import { maskEmail } from '@/utils/dataMasking';
import { TwoFactorAuthManager } from '@/utils/twoFactorAuth';

interface SecureEndpointOptions {
  rateLimitKey: string;
  validationSchema?: string;
  requiredRole?: string;
  requiresElevated?: boolean;
  requires2FA?: boolean;
  allowedMethods?: string[];
  businessHoursOnly?: boolean;
}

interface RequestContext {
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  sessionInfo?: any;
  tfaSessionToken?: string;
}

class SecureAPIManager {
  private static instance: SecureAPIManager;
  private endpoints = new Map<string, SecureEndpointOptions>();
  private corsOptions = {
    origin: true, // Will be configured per environment
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'apikey']
  };

  static getInstance(): SecureAPIManager {
    if (!SecureAPIManager.instance) {
      SecureAPIManager.instance = new SecureAPIManager();
    }
    return SecureAPIManager.instance;
  }

  /**
   * Register a secure endpoint with its security configuration
   */
  registerEndpoint(path: string, options: SecureEndpointOptions): void {
    this.endpoints.set(path, options);
    logger.info('Secure endpoint registered', { path, options });
  }

  /**
   * Middleware to protect API endpoints
   */
  async protectEndpoint(
    path: string,
    method: string,
    body: any,
    headers: any,
    operation: () => Promise<any>
  ): Promise<{ success: boolean; data?: any; error?: string; status?: number }> {
    const endpoint = this.endpoints.get(path);
    
    if (!endpoint) {
      logger.warn('Unregistered endpoint accessed', { path, method });
      return { success: false, error: 'Endpoint not configured', status: 404 };
    }

    try {
      // Extract request context
      const context = await this.extractRequestContext(headers);
      
      // Method validation
      if (endpoint.allowedMethods && !endpoint.allowedMethods.includes(method)) {
        return { success: false, error: 'Method not allowed', status: 405 };
      }

      // Business hours check (disabled - we work all the time now)
      // Skip business hours validation as requested

      // 2FA check for sensitive operations
      if (endpoint.requires2FA && context.userEmail) {
        const status = await TwoFactorAuthManager.getTwoFactorStatus(context.userEmail);
        const has2FA = status.enabled;
        if (!has2FA) {
          logger.warn('2FA required but not enabled', {
            path,
            userEmail: maskEmail(context.userEmail)
          });
          return {
            success: false,
            error: 'Two-factor authentication is required for this operation',
            status: 403
          };
        }

        // Verify 2FA session if provided
        if (context.tfaSessionToken) {
          try {
            const sessionValid = await TwoFactorAuthManager.verifySecureSession(context.tfaSessionToken);
            if (!sessionValid || !sessionValid.valid) {
              logger.warn('Invalid 2FA session', {
                path,
                userEmail: maskEmail(context.userEmail)
              });
              return {
                success: false,
                error: 'Valid 2FA verification required for this operation',
                status: 403
              };
            }
          } catch (error) {
            logger.error('2FA session verification failed', {
              path,
              userEmail: maskEmail(context.userEmail),
              error
            });
            return {
              success: false,
              error: 'Failed to verify 2FA session',
              status: 500
            };
          }
        } else {
          return {
            success: false,
            error: 'This operation requires 2FA verification',
            status: 403
          };
        }
      }

      // Rate limiting
      const rateLimitResult = rateLimiter.checkLimit(endpoint.rateLimitKey, 
        context.userEmail || context.ipAddress || 'anonymous');
      
      if (!rateLimitResult.allowed) {
        logger.warn('Rate limit exceeded', {
          path,
          userEmail: maskEmail(context.userEmail),
          remaining: rateLimitResult.remaining
        });
        return { 
          success: false, 
          error: 'Rate limit exceeded', 
          status: 429 
        };
      }

      // Request validation
      if (endpoint.validationSchema) {
        const validation = requestValidator.validate(endpoint.validationSchema, body, context);
        if (!validation.isValid) {
          logger.warn('Request validation failed', {
            path,
            errors: validation.errors,
            userEmail: maskEmail(context.userEmail)
          });
          return { 
            success: false, 
            error: 'Validation failed', 
            status: 400 
          };
        }
      }

      // Authentication check
      if (endpoint.requiredRole) {
        if (!context.userEmail) {
          return { success: false, error: 'Authentication required', status: 401 };
        }

        // Role-based access check
        const hasRole = await this.checkUserRole(context.userEmail, endpoint.requiredRole);
        if (!hasRole) {
          logger.warn('Insufficient permissions', {
            path,
            userEmail: maskEmail(context.userEmail),
            requiredRole: endpoint.requiredRole
          });
          return { success: false, error: 'Insufficient permissions', status: 403 };
        }

        // Elevated permissions check
        if (endpoint.requiresElevated) {
          const hasElevated = await this.checkElevatedPermissions(context.userEmail);
          if (!hasElevated) {
            return { 
              success: false, 
              error: 'Elevated permissions required. Please re-authenticate.', 
              status: 403 
            };
          }
        }
      }

      // Execute the operation
      logger.info('Secure API call initiated', {
        path,
        method,
        userEmail: maskEmail(context.userEmail),
        ipAddress: context.ipAddress
      });

      const result = await operation();
      
      // Log successful operation
      logger.info('Secure API call completed', {
        path,
        userEmail: maskEmail(context.userEmail),
        success: true
      });

      return { success: true, data: result };

    } catch (error: any) {
      logger.error('Secure API operation failed', {
        path,
        error: error.message,
        stack: error.stack
      });
      
      return { 
        success: false, 
        error: 'Internal server error', 
        status: 500 
      };
    }
  }

  /**
   * Extract request context from headers
   */
  private async extractRequestContext(headers: any): Promise<RequestContext> {
    const context: RequestContext = {
      timestamp: new Date().toISOString(),
      ipAddress: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
      userAgent: headers['user-agent'] || 'unknown'
    };

    // Extract user info from Authorization header
    const authHeader = headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          context.userEmail = user.email;
          
          // Get user role
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('email', user.email)
            .eq('is_active', true)
            .single();
          
          if (adminUser) {
            context.userRole = adminUser.role;
          }
        }
      } catch (error) {
        logger.warn('Failed to extract user context from token', { error });
      }
    }

    // Extract 2FA session token from custom header
    context.tfaSessionToken = headers['x-2fa-session'];

    return context;
  }

  /**
   * Check if user has required role
   */
  private async checkUserRole(userEmail: string, requiredRole: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single();

      if (!data) return false;

      const roleHierarchy = {
        'super_admin': 4,
        'admin': 3,
        'editor': 2,
        'moderator': 1
      };

      const userLevel = roleHierarchy[data.role as keyof typeof roleHierarchy] || 0;
      const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

      return userLevel >= requiredLevel;
    } catch (error) {
      logger.error('Failed to check user role', { error, userEmail: maskEmail(userEmail) });
      return false;
    }
  }

  /**
   * Check if user has elevated permissions (mocked for now)
   */
  private async checkElevatedPermissions(userEmail: string): Promise<boolean> {
    // In a real implementation, this would check session elevation status
    // For now, we'll return true but log the requirement
    logger.info('Elevated permissions check', { 
      userEmail: maskEmail(userEmail),
      // In real implementation: check adminSecurityManager.hasElevatedPermissions()
    });
    return true;
  }

  /**
   * Check if current time is within business hours (disabled - we work all the time)
   */
  private isBusinessHours(): boolean {
    // Always return true - we work all the time now
    return true;
  }

  /**
   * Generate secure response with security headers
   */
  generateSecureResponse(result: any, status: number = 200): Response {
    const headers = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    return new Response(JSON.stringify(result), {
      status,
      headers
    });
  }
}

// Global instance
export const secureAPI = SecureAPIManager.getInstance();

// Register common secure endpoints with 2FA requirements
secureAPI.registerEndpoint('/admin/users', {
  rateLimitKey: 'admin_operations',
  validationSchema: 'user_list',
  requiredRole: 'admin',
  requires2FA: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  businessHoursOnly: false
});

secureAPI.registerEndpoint('/admin/users/create', {
  rateLimitKey: 'admin_user_creation',
  validationSchema: 'admin_user_create',
  requiredRole: 'super_admin',
  requiresElevated: true,
  requires2FA: true,
  allowedMethods: ['POST'],
  businessHoursOnly: false
});

secureAPI.registerEndpoint('/admin/users/delete', {
  rateLimitKey: 'admin_user_deletion',
  requiredRole: 'super_admin',
  requiresElevated: true,
  requires2FA: true,
  allowedMethods: ['DELETE'],
  businessHoursOnly: false
});

secureAPI.registerEndpoint('/admin/data-export', {
  rateLimitKey: 'data_export',
  validationSchema: 'data_export',
  requiredRole: 'admin',
  requiresElevated: true,
  requires2FA: true,
  allowedMethods: ['POST'],
  businessHoursOnly: false
});

// Additional 2FA-protected endpoints
secureAPI.registerEndpoint('/admin/settings', {
  rateLimitKey: 'admin_settings',
  requiredRole: 'admin',
  requires2FA: true,
  allowedMethods: ['GET', 'PUT'],
  businessHoursOnly: false
});

secureAPI.registerEndpoint('/admin/audit-logs', {
  rateLimitKey: 'audit_access',
  requiredRole: 'admin',
  requires2FA: true,
  allowedMethods: ['GET'],
  businessHoursOnly: false
});

secureAPI.registerEndpoint('/admin/security-events', {
  rateLimitKey: 'security_events',
  requiredRole: 'admin',
  requires2FA: true,
  allowedMethods: ['GET'],
  businessHoursOnly: false
});

/**
 * Secure endpoint wrapper function
 */
export const withSecureEndpoint = (
  path: string,
  method: string,
  body: any,
  headers: any,
  operation: () => Promise<any>
) => {
  return secureAPI.protectEndpoint(path, method, body, headers, operation);
};