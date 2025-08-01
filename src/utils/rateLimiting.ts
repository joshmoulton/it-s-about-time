// Rate limiting utilities for API protection
import { logger } from './secureLogger';
import { maskEmail } from './dataMasking';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests in window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
  onLimitReached?: (identifier: string) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private requestCounts = new Map<string, { count: number; resetTime: number; hits: Array<number> }>();
  private configs = new Map<string, RateLimitConfig>();

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Register rate limit configuration for an endpoint
   */
  registerLimit(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, config);
    logger.info('Rate limit registered', { endpoint, config });
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(endpoint: string, identifier: string): RateLimitResult {
    const config = this.configs.get(endpoint);
    if (!config) {
      // No rate limit configured - allow by default
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now() + 3600000, // 1 hour from now
        totalHits: 0
      };
    }

    const key = config.keyGenerator ? config.keyGenerator(identifier) : `${endpoint}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create request tracking for this key
    let requestData = this.requestCounts.get(key);
    if (!requestData || requestData.resetTime <= now) {
      requestData = {
        count: 0,
        resetTime: now + config.windowMs,
        hits: []
      };
      this.requestCounts.set(key, requestData);
    }

    // Clean old hits outside the window
    requestData.hits = requestData.hits.filter(hit => hit > windowStart);

    // Check if limit exceeded
    if (requestData.hits.length >= config.maxRequests) {
      if (config.onLimitReached) {
        config.onLimitReached(identifier);
      }

      logger.warn('Rate limit exceeded', {
        endpoint,
        identifier: maskEmail(identifier),
        hits: requestData.hits.length,
        limit: config.maxRequests,
        windowMs: config.windowMs
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: requestData.resetTime,
        totalHits: requestData.hits.length
      };
    }

    // Add current request
    requestData.hits.push(now);
    requestData.count++;

    return {
      allowed: true,
      remaining: config.maxRequests - requestData.hits.length,
      resetTime: requestData.resetTime,
      totalHits: requestData.hits.length
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  resetLimit(endpoint: string, identifier: string): void {
    const config = this.configs.get(endpoint);
    if (!config) return;

    const key = config.keyGenerator ? config.keyGenerator(identifier) : `${endpoint}:${identifier}`;
    this.requestCounts.delete(key);
    
    logger.info('Rate limit reset', { endpoint, identifier: maskEmail(identifier) });
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(endpoint: string, identifier: string): { hits: number; remaining: number; resetTime: number } | null {
    const config = this.configs.get(endpoint);
    if (!config) return null;

    const key = config.keyGenerator ? config.keyGenerator(identifier) : `${endpoint}:${identifier}`;
    const requestData = this.requestCounts.get(key);
    
    if (!requestData) {
      return {
        hits: 0,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;
    const validHits = requestData.hits.filter(hit => hit > windowStart);

    return {
      hits: validHits.length,
      remaining: Math.max(0, config.maxRequests - validHits.length),
      resetTime: requestData.resetTime
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, data] of this.requestCounts.entries()) {
      if (data.resetTime <= now) {
        this.requestCounts.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Rate limiter cleanup completed', { entriesRemoved: cleaned });
    }
  }
}

// Global instance
export const rateLimiter = RateLimiter.getInstance();

// Default rate limit configurations
export const DEFAULT_RATE_LIMITS = {
  // Admin operations - very strict
  admin_user_creation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },
  admin_user_deletion: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  
  // General admin actions
  admin_operations: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  
  // Authentication
  login_attempts: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    onLimitReached: (identifier: string) => {
      logger.warn('Login rate limit exceeded', { identifier: maskEmail(identifier) });
    }
  },
  
  // API endpoints
  api_general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // Data export operations
  data_export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  
  // Sensitive data access
  sensitive_data_access: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  }
};

// Register default rate limits
Object.entries(DEFAULT_RATE_LIMITS).forEach(([endpoint, config]) => {
  rateLimiter.registerLimit(endpoint, config);
});

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Middleware function for rate limiting
 */
export const withRateLimit = (
  endpoint: string,
  identifier: string,
  operation: () => Promise<any>
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const limitResult = rateLimiter.checkLimit(endpoint, identifier);
    
    if (!limitResult.allowed) {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      (error as any).retryAfter = Math.ceil((limitResult.resetTime - Date.now()) / 1000);
      (error as any).rateLimitInfo = limitResult;
      
      reject(error);
      return;
    }

    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Rate limit decorator for functions
 */
export function rateLimit(endpoint: string, identifierGetter?: (args: any[]) => string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const identifier = identifierGetter ? identifierGetter(args) : 'default';
      
      return withRateLimit(endpoint, identifier, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}