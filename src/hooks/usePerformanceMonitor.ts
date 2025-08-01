
import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

// Client-side user preferences management (replaces server-side storage)
interface UserPreferences {
  theme?: 'light' | 'dark';
  tradingProfile?: {
    experienceLevel?: string;
    riskTolerance?: string;
    preferredMarkets?: string[];
    // ... other questionnaire data
  };
  notifications?: {
    telegramEnabled?: boolean;
    emailEnabled?: boolean;
  };
}

// Utility functions for client-side data management
export const ClientStorage = {
  getUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem('user_preferences');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  setUserPreferences(preferences: Partial<UserPreferences>) {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem('user_preferences', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  },

  clearUserData() {
    try {
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('trading_questionnaire');
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear user data:', error);
    }
  }
};

export function usePerformanceMonitor() {
  const reportMetrics = useCallback((metrics: PerformanceMetrics) => {
    // Only log in development and throttle warnings to prevent spam
    if (process.env.NODE_ENV === 'development') {
      const isMobile = window.innerWidth < 768;
      // Updated thresholds to be more realistic and reduce false positives
      const concerningMetrics = {
        fcp: isMobile ? 3500 : 2500, // Slightly more lenient
        lcp: isMobile ? 5500 : 4000, // Slightly more lenient
        fid: 110, // Increased from 100ms to reduce false warnings
        cls: 0.1,
        ttfb: 1200 // Slightly more lenient for real-world conditions
      };

      const issues = Object.entries(metrics).filter(([key, value]) => {
        const threshold = concerningMetrics[key as keyof typeof concerningMetrics];
        return value && threshold && value > threshold;
      });

      // Throttle warnings to prevent console spam and performance impact
      if (issues.length > 0) {
        const lastWarning = (window as any).lastPerfWarning || 0;
        const now = Date.now();
        if (now - lastWarning > 10000) { // Only warn every 10 seconds instead of 5
          console.warn('Performance issues detected:', Object.fromEntries(issues));
          (window as any).lastPerfWarning = now;
        }
      }
    }
  }, []);

  useEffect(() => {
    // Monitor Core Web Vitals with optimized observers
    if ('PerformanceObserver' in window) {
      const observers: PerformanceObserver[] = [];

      try {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            reportMetrics({ fcp: fcp.startTime });
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        observers.push(fcpObserver);

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            reportMetrics({ lcp: lastEntry.startTime });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observers.push(lcpObserver);

        // First Input Delay with better error handling
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime;
              if (fid > 0) { // Only report positive values
                reportMetrics({ fid });
              }
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        observers.push(fidObserver);

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput && entry.value > 0) {
              clsValue += entry.value;
            }
          });
          if (clsValue > 0) {
            reportMetrics({ cls: clsValue });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observers.push(clsObserver);

        // Navigation timing for TTFB
        if (performance.getEntriesByType) {
          const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navEntries.length > 0) {
            const nav = navEntries[0];
            const ttfb = nav.responseStart - nav.requestStart;
            if (ttfb > 0) { // Only report positive values
              reportMetrics({ ttfb });
            }
          }
        }

        return () => {
          observers.forEach(observer => observer.disconnect());
        };
      } catch (error) {
        // Silently handle any observer creation errors
        console.warn('Performance monitoring initialization failed:', error);
      }
    }
  }, [reportMetrics]);

  // Optimized memory monitoring - less frequent and mobile-specific
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance && window.innerWidth < 768) {
      const checkMemory = () => {
        try {
          const memory = (performance as any).memory;
          if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
            const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
            if (usedPercent > 85) { // Increased threshold to 85%
              console.warn('High memory usage detected:', usedPercent.toFixed(1) + '%');
            }
          }
        } catch (error) {
          // Silently handle memory check errors
        }
      };

      const interval = setInterval(checkMemory, 600000); // Check every 10 minutes instead of 5
      return () => clearInterval(interval);
    }
  }, []);
}
