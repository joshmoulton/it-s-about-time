/**
 * Global authentication request deduplication system
 * Prevents duplicate magic link requests and other auth operations
 */

interface PendingRequest {
  email: string;
  type: 'magic_link' | 'signin' | 'signup';
  timestamp: number;
  promise: Promise<any>;
}

class AuthRequestDeduplication {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly DEDUP_WINDOW_MS = 30000; // 30 seconds deduplication window

  private getRequestKey(email: string, type: string): string {
    return `${type}:${email.toLowerCase().trim()}`;
  }

  private isRequestRecent(timestamp: number): boolean {
    return Date.now() - timestamp < this.DEDUP_WINDOW_MS;
  }

  async deduplicateRequest<T>(
    email: string,
    type: 'magic_link' | 'signin' | 'signup',
    requestFn: () => Promise<T>
  ): Promise<T> {
    const key = this.getRequestKey(email, type);
    
    // Check both memory and localStorage for cross-tab deduplication
    const existing = this.pendingRequests.get(key);
    const localStorageKey = `auth_dedup_${key}`;
    const localStorageData = localStorage.getItem(localStorageKey);
    
    let recentRequest = existing;
    if (!recentRequest && localStorageData) {
      try {
        const parsed = JSON.parse(localStorageData);
        if (this.isRequestRecent(parsed.timestamp)) {
          console.log(`🔄 Cross-tab deduplication for ${type} request for ${email} (${Date.now() - parsed.timestamp}ms ago)`);
          // Return a resolved promise for cross-tab requests
          return Promise.resolve({ success: true, message: 'Request already in progress in another tab' } as T);
        } else {
          localStorage.removeItem(localStorageKey);
        }
      } catch (e) {
        localStorage.removeItem(localStorageKey);
      }
    }

    // If there's a recent pending request, return its promise
    if (recentRequest && this.isRequestRecent(recentRequest.timestamp)) {
      console.log(`🔄 Deduplicating ${type} request for ${email} (${Date.now() - recentRequest.timestamp}ms ago)`);
      return recentRequest.promise;
    }

    // Create new request
    console.log(`✅ Creating new ${type} request for ${email}`);
    
    // Store in localStorage for cross-tab deduplication
    localStorage.setItem(localStorageKey, JSON.stringify({
      email,
      type,
      timestamp: Date.now()
    }));

    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
      localStorage.removeItem(localStorageKey);
    });

    // Store the request
    this.pendingRequests.set(key, {
      email,
      type,
      timestamp: Date.now(),
      promise
    });

    return promise;
  }

  // Clean up old requests periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (!this.isRequestRecent(request.timestamp)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  // Get current pending requests for debugging
  getPendingRequests(): Array<{ key: string; email: string; type: string; age: number }> {
    const now = Date.now();
    return Array.from(this.pendingRequests.entries()).map(([key, request]) => ({
      key,
      email: request.email,
      type: request.type,
      age: now - request.timestamp
    }));
  }
}

// Global singleton instance
export const authRequestDeduplication = new AuthRequestDeduplication();

// Clean up every 10 seconds
setInterval(() => {
  authRequestDeduplication.cleanup();
}, 10000);