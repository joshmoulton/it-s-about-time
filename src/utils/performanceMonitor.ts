// Advanced performance monitoring for 90+ PageSpeed scores
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration || (entry as any).value);
          
          // Log performance issues in development
          if (import.meta.env.DEV) {
            if (entry.duration && entry.duration > 100) {
              console.warn(`⚠️ Slow ${entry.entryType}:`, entry.name, `${entry.duration}ms`);
            }
          }
        }
      });

      // Observe all performance entries
      try {
        this.observer.observe({ 
          entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
        });
      } catch (e) {
        // Fallback for older browsers
        console.warn('Performance monitoring not fully supported');
      }
    }

    // Monitor Core Web Vitals
    this.monitorWebVitals();
  }

  private monitorWebVitals() {
    // LCP - Largest Contentful Paint
    this.measureLCP();
    
    // FID - First Input Delay  
    this.measureFID();
    
    // CLS - Cumulative Layout Shift
    this.measureCLS();
  }

  private measureLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          this.recordMetric('LCP', lastEntry.startTime);
          
          if (import.meta.env.DEV && lastEntry.startTime > 2500) {
            console.warn('🐌 Poor LCP:', lastEntry.startTime + 'ms');
          }
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('LCP monitoring not supported');
      }
    }
  }

  private measureFID() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const firstInputEntry = entry as any;
            this.recordMetric('FID', firstInputEntry.processingStart - firstInputEntry.startTime);
            
            if (import.meta.env.DEV && (firstInputEntry.processingStart - firstInputEntry.startTime) > 100) {
              console.warn('🐌 Poor FID:', (firstInputEntry.processingStart - firstInputEntry.startTime) + 'ms');
            }
          }
        });
        
        observer.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('FID monitoring not supported');
      }
    }
  }

  private measureCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.recordMetric('CLS', clsValue);
              
              if (import.meta.env.DEV && clsValue > 0.1) {
                console.warn('🐌 Poor CLS:', clsValue);
              }
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('CLS monitoring not supported');
      }
    }
  }

  private recordMetric(name: string, value: number) {
    this.metrics.set(name, value);
  }

  public getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy();
  });
}