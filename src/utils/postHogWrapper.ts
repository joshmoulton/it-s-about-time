// PostHog wrapper with rate limiting protection and circuit breaker
declare global {
  interface Window {
    posthog?: any;
  }
}

interface PostHogState {
  rateLimitDetected: boolean;
  circuitBreakerActive: boolean;
  lastRateLimit: number;
  eventCount: number;
  lastEventTime: number;
}

class PostHogWrapper {
  private state: PostHogState = {
    rateLimitDetected: false,
    circuitBreakerActive: false,
    lastRateLimit: 0,
    eventCount: 0,
    lastEventTime: 0
  };

  private readonly RATE_LIMIT_COOLDOWN = 120000; // 2 minute cooldown
  private readonly MAX_EVENTS_PER_MINUTE = 2; // Reduced to 2 events per minute
  private readonly CIRCUIT_BREAKER_THRESHOLD = 2; // After 2 rate limits, activate circuit breaker
  private rateLimitCount = 0; // Track consecutive rate limits

  constructor() {
    // Suppress ALL PostHog console messages
    if (typeof window !== 'undefined') {
      this.suppressPostHogLogs();
    }
  }

  private suppressPostHogLogs(): void {
    // Override all console methods to filter out PostHog messages
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const originalConsoleDebug = console.debug;

    const shouldSuppressMessage = (args: any[]): boolean => {
      const message = args.join(' ').toLowerCase();
      return message.includes('posthog') || message.includes('[posthog.js]');
    };

    console.error = (...args: any[]) => {
      if (shouldSuppressMessage(args)) {
        const message = args.join(' ');
        if (message.includes('rate limiting') || message.includes('rate limit')) {
          this.handleRateLimit();
        }
        // Suppress PostHog messages completely
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (!shouldSuppressMessage(args)) {
        originalConsoleWarn.apply(console, args);
      }
    };

    console.log = (...args: any[]) => {
      if (!shouldSuppressMessage(args)) {
        originalConsoleLog.apply(console, args);
      }
    };

    console.info = (...args: any[]) => {
      if (!shouldSuppressMessage(args)) {
        originalConsoleInfo.apply(console, args);
      }
    };

    console.debug = (...args: any[]) => {
      if (!shouldSuppressMessage(args)) {
        originalConsoleDebug.apply(console, args);
      }
    };
  }

  private handleRateLimit(): void {
    const now = Date.now();
    this.state.rateLimitDetected = true;
    this.state.lastRateLimit = now;
    this.rateLimitCount++;
    
    // Activate circuit breaker after threshold consecutive rate limits
    if (this.rateLimitCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.state.circuitBreakerActive = true;
      // Note: Don't use "PostHog" in the message to avoid console suppression
    }
  }

  private shouldSendEvent(): boolean {
    const now = Date.now();
    
    // If circuit breaker is active, don't send events
    if (this.state.circuitBreakerActive) {
      // Reset circuit breaker after extended cooldown
      if (now - this.state.lastRateLimit > this.RATE_LIMIT_COOLDOWN * 2) {
        this.state.circuitBreakerActive = false;
        this.state.rateLimitDetected = false;
        this.rateLimitCount = 0; // Reset consecutive rate limit count
        // Note: Don't use "PostHog" in the message to avoid console suppression
      } else {
        return false;
      }
    }

    // Rate limit our own events (max 1 event per second)
    if (now - this.state.lastEventTime < 1000) {
      return false;
    }

    // Reset event count every minute
    if (now - this.state.lastEventTime > 60000) {
      this.state.eventCount = 0;
    }

    // Check if we're over our event limit
    if (this.state.eventCount >= this.MAX_EVENTS_PER_MINUTE) {
      // Note: Don't use "PostHog" in the message to avoid console suppression
      return false;
    }

    return true;
  }

  capture(event: string, properties?: any): void {
    // Extra rate limiting for newsletter pages
    if (this.isNewsletterPage() && this.state.eventCount >= Math.floor(this.MAX_EVENTS_PER_MINUTE / 2)) {
      // Note: Don't use "PostHog" in the message to avoid console suppression
      return;
    }

    if (!this.shouldSendEvent()) {
      return;
    }

    try {
      this.state.eventCount++;
      this.state.lastEventTime = Date.now();
      
      // Filter out potentially excessive properties
      const filteredProperties = properties ? this.filterProperties(properties) : undefined;
      
      // Debug logging for newsletter pages
      if (this.isNewsletterPage()) {
        // Note: Don't use "PostHog" in the message to avoid console suppression
      }
      
      if (window.posthog) {
        window.posthog.capture(event, filteredProperties);
      }
    } catch (error) {
      // Silently handle errors to prevent cascade
    }
  }

  private isNewsletterPage(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.includes('/newsletters/');
  }

  private filterProperties(properties: any): any {
    // Remove potentially noisy properties
    const filtered = { ...properties };
    
    // Remove performance-related properties that might be too frequent
    delete filtered.timestamp;
    delete filtered.memoryUsage;
    delete filtered.renderTime;
    delete filtered.sessionTime;
    
    // Remove newsletter-specific properties that might cause excessive events
    if (this.isNewsletterPage()) {
      delete filtered.scrollPosition;
      delete filtered.readingProgress;
      delete filtered.pageLoadTime;
    }
    
    return filtered;
  }

  identify(userId: string, properties?: any): void {
    if (!this.shouldSendEvent()) {
      return;
    }

    try {
      if (window.posthog) {
        window.posthog.identify(userId, properties);
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  reset(): void {
    try {
      if (window.posthog) {
        window.posthog.reset();
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  // Get current state for debugging
  getState(): PostHogState {
    return { ...this.state };
  }

  // Get rate limit count for debugging
  getRateLimitCount(): number {
    return this.rateLimitCount;
  }

  // Check if on newsletter page for debugging
  checkIsNewsletterPage(): boolean {
    return this.isNewsletterPage();
  }

  // Manual circuit breaker reset (for admin use)
  resetCircuitBreaker(): void {
    this.state.circuitBreakerActive = false;
    this.state.rateLimitDetected = false;
    this.state.eventCount = 0;
    this.rateLimitCount = 0; // Reset consecutive rate limit count
    // Note: Don't use "PostHog" in the message to avoid console suppression
  }
}

export const postHogWrapper = new PostHogWrapper();

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).__postHogDebug = {
    getState: () => postHogWrapper.getState(),
    resetCircuitBreaker: () => postHogWrapper.resetCircuitBreaker(),
    getRateLimitCount: () => postHogWrapper.getRateLimitCount(),
    isNewsletterPage: () => postHogWrapper.checkIsNewsletterPage(),
    enableDebugLogging: () => {
      // Note: Don't use "PostHog" in the message to avoid console suppression
      const originalDebug = console.debug;
      console.debug = (...args: any[]) => {
        if (args[0] && args[0].includes('Analytics')) {
          originalDebug.apply(console, args);
        }
      };
    }
  };
}