// Performance monitor to track excessive re-renders and API calls
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private componentRenderCounts = new Map<string, number>();
  private apiCallCounts = new Map<string, number>();
  private lastResetTime = Date.now();
  private readonly RESET_INTERVAL = 60000; // Reset counters every minute
  
  private constructor() {}
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  trackRender(componentName: string): void {
    const count = this.componentRenderCounts.get(componentName) || 0;
    this.componentRenderCounts.set(componentName, count + 1);
    
    // Reset counters if enough time has passed
    if (Date.now() - this.lastResetTime > this.RESET_INTERVAL) {
      this.reset();
    }
    
    // Warn if component is re-rendering too frequently
    if (count > 20) {
      console.warn(`🐌 Component ${componentName} has rendered ${count} times in the last minute`);
    }
  }
  
  trackApiCall(endpoint: string): void {
    const count = this.apiCallCounts.get(endpoint) || 0;
    this.apiCallCounts.set(endpoint, count + 1);
    
    // Warn if API is being called too frequently
    if (count > 10) {
      console.warn(`📡 API endpoint ${endpoint} called ${count} times in the last minute`);
    }
  }
  
  private reset(): void {
    this.componentRenderCounts.clear();
    this.apiCallCounts.clear();
    this.lastResetTime = Date.now();
  }
  
  getStats() {
    return {
      renders: Object.fromEntries(this.componentRenderCounts),
      apiCalls: Object.fromEntries(this.apiCallCounts),
      resetTime: this.lastResetTime
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();