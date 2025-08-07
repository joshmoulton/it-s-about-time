// Enhanced security middleware for edge functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

// Security headers configuration
const getSecurityHeaders = (context: 'admin' | 'public' = 'public') => {
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
    basePolicy[1] = "script-src 'self'";
    basePolicy.push("frame-ancestors 'none'");
  }
  
  return {
    'Content-Security-Policy': basePolicy.join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': context === 'admin' ? 'DENY' : 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

// Rate limiting with Redis-like behavior using Supabase
class EdgeRateLimit {
  private supabase: any;
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }
  
  async checkLimit(
    key: string, 
    limit: number = 10, 
    windowMs: number = 60000
  ): Promise<{ allowed: boolean; retryAfter?: number; attempts: number }> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    
    try {
      // Check current count
      const { data: existing, error } = await this.supabase
        .from('auth_rate_limits')
        .select('attempt_count, blocked_until')
        .eq('email', key)
        .eq('window_start', new Date(windowStart).toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') { // Not "not found" error
        console.error('Rate limit check error:', error);
        return { allowed: true, attempts: 0 }; // Fail open
      }
      
      const currentCount = existing?.attempt_count || 0;
      const blockedUntil = existing?.blocked_until ? new Date(existing.blocked_until).getTime() : 0;
      
      // Check if still blocked
      if (blockedUntil > now) {
        return { 
          allowed: false, 
          retryAfter: blockedUntil - now,
          attempts: currentCount 
        };
      }
      
      // Check if within limit
      if (currentCount >= limit) {
        // Calculate block duration (progressive)
        const blockDuration = Math.min(300000, 1000 * Math.pow(2, currentCount - limit));
        const blockedUntilTime = new Date(now + blockDuration);
        
        // Update blocked status
        await this.supabase
          .from('auth_rate_limits')
          .upsert({
            email: key,
            ip_address: '0.0.0.0', // Placeholder
            window_start: new Date(windowStart).toISOString(),
            attempt_count: currentCount + 1,
            blocked_until: blockedUntilTime.toISOString(),
            updated_at: new Date().toISOString()
          });
        
        return { 
          allowed: false, 
          retryAfter: blockDuration,
          attempts: currentCount + 1 
        };
      }
      
      // Increment counter
      await this.supabase
        .from('auth_rate_limits')
        .upsert({
          email: key,
          ip_address: '0.0.0.0', // Placeholder
          window_start: new Date(windowStart).toISOString(),
          attempt_count: currentCount + 1,
          blocked_until: null,
          updated_at: new Date().toISOString()
        });
      
      return { allowed: true, attempts: currentCount + 1 };
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      return { allowed: true, attempts: 0 }; // Fail open for availability
    }
  }
}

// Input validation and sanitization
const validateAndSanitizeInput = (data: any): { isValid: boolean; sanitized: any; errors: string[] } => {
  const errors: string[] = [];
  const sanitized: any = {};
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, sanitized: {}, errors: ['Invalid input data'] };
  }
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Basic sanitization
      let clean = value.trim();
      
      // Remove potential XSS patterns
      clean = clean.replace(/<script[^>]*>.*?<\/script>/gi, '');
      clean = clean.replace(/javascript:/gi, '');
      clean = clean.replace(/on\w+\s*=/gi, '');
      clean = clean.replace(/data:text\/html/gi, '');
      
      // Limit length
      if (clean.length > 10000) {
        clean = clean.substring(0, 10000);
        errors.push(`Field ${key} was truncated due to length`);
      }
      
      sanitized[key] = clean;
    } else {
      sanitized[key] = value;
    }
  }
  
  return { isValid: errors.length === 0, sanitized, errors };
};

// Security context extraction
const createSecurityContext = (request: Request) => {
  const headers = request.headers;
  
  return {
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               headers.get('cf-connecting-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    origin: headers.get('origin') || 'unknown',
    referer: headers.get('referer') || 'unknown',
    timestamp: new Date().toISOString()
  };
};

// Enhanced security middleware
export const withSecurity = (
  handler: (req: Request, context: any) => Promise<Response>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { key: string; limit: number; windowMs: number };
    validateInput?: boolean;
    adminOnly?: boolean;
    logAccess?: boolean;
  } = {}
) => {
  return async (req: Request): Promise<Response> => {
    const securityHeaders = getSecurityHeaders(options.adminOnly ? 'admin' : 'public');
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: securityHeaders 
      });
    }
    
    try {
      const context = createSecurityContext(req);
      
      // Rate limiting
      if (options.rateLimit) {
        const rateLimiter = new EdgeRateLimit();
        const { allowed, retryAfter } = await rateLimiter.checkLimit(
          options.rateLimit.key + '_' + context.ipAddress,
          options.rateLimit.limit,
          options.rateLimit.windowMs
        );
        
        if (!allowed) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded', retryAfter }),
            { 
              status: 429, 
              headers: { 
                ...securityHeaders,
                'Retry-After': Math.ceil((retryAfter || 60000) / 1000).toString(),
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      
      // Input validation
      let requestData = null;
      if (options.validateInput && req.method !== 'GET') {
        try {
          requestData = await req.json();
          const validation = validateAndSanitizeInput(requestData);
          
          if (!validation.isValid) {
            return new Response(
              JSON.stringify({ error: 'Invalid input', details: validation.errors }),
              { 
                status: 400, 
                headers: { 
                  ...securityHeaders,
                  'Content-Type': 'application/json'
                }
              }
            );
          }
          
          requestData = validation.sanitized;
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON' }),
            { 
              status: 400, 
              headers: { 
                ...securityHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      
      // Create enhanced request with security context
      const enhancedContext = {
        ...context,
        sanitizedData: requestData
      };
      
      // Call the actual handler
      const response = await handler(req, enhancedContext);
      
      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500, 
          headers: { 
            ...securityHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
};

// Export for use in edge functions
export { getSecurityHeaders, createSecurityContext, validateAndSanitizeInput };