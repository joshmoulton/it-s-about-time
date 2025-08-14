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
  private readonly DEDUP_WINDOW_MS = 5000; // 5 seconds deduplication window

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
    const existing = this.pendingRequests.get(key);

    // If there's a recent pending request, return its promise
    if (existing && this.isRequestRecent(existing.timestamp)) {
      console.log(`🔄 Deduplicating ${type} request for ${email} (${Date.now() - existing.timestamp}ms ago)`);
      return existing.promise;
    }

    // Create new request
    console.log(`✅ Creating new ${type} request for ${email}`);
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
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