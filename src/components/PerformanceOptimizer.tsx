import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/utils/secureLogger';

// Enhanced performance monitoring with Web Vitals
interface PerformanceMetrics {
  memoryUsage: number;
  renderCount: number;
  lastRenderTime: number;
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  lcp: number; // Largest Contentful Paint
}

// Enhanced performance monitoring and optimization component
export const PerformanceOptimizer = memo(() => {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderCount: 0,
    lastRenderTime: 0,
    cls: 0,
    fid: 0,
    lcp: 0
  });

  // Track slow components
  const slowComponentsRef = useRef<Map<string, number>>(new Map());

  // Optimized debounced performance logger
  const logPerformance = useCallback(
    debounce((data: any) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('🚀 Performance Metrics:', data);
      }
    }, 2000), // Increased debounce time to reduce logging frequency
    []
  );

  // Enhanced monitoring with Web Vitals and optimizations
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Only monitor in development and with reasonable frequency
    if (process.env.NODE_ENV === 'development') {
      interval = setInterval(() => {
        try {
          const metrics: Partial<PerformanceMetrics> = {};
          
          // Memory monitoring
          if ('memory' in performance) {
            const memoryInfo = (performance as any).memory;
            metrics.memoryUsage = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
          }

          // Get navigation timing for LCP approximation
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            metrics.lcp = navigation.loadEventEnd - navigation.loadEventStart;
          }

          setPerformanceData(prev => ({
            ...prev,
            ...metrics,
            renderCount: prev.renderCount + 1,
            lastRenderTime: Date.now()
          }));

          // Enhanced memory warning with suggestions
          if (metrics.memoryUsage && metrics.memoryUsage > 150) {
            logger.warn('⚠️ High memory usage detected:', metrics.memoryUsage, 'MB');
            logger.info('💡 Performance tip: Consider implementing React.memo for expensive components');
          }

          // Monitor long tasks
          if (navigation && navigation.loadEventEnd > 3000) {
            logger.warn('🐌 Slow page load detected:', navigation.loadEventEnd + 'ms');
          }

          logPerformance({ 
            ...metrics, 
            timestamp: Date.now(),
            slowComponents: Array.from(slowComponentsRef.current.entries())
          });
        } catch (error) {
          // Silently handle errors to avoid performance impact
        }
      }, 90000); // Optimized: Check every 90 seconds for less impact
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [logPerformance]);

  // Cleanup unused components
  useEffect(() => {
    const cleanup = () => {
      // Clear any timers or intervals
      // Force garbage collection if possible (development only)
      if (process.env.NODE_ENV === 'development' && window.gc) {
        window.gc();
      }
    };

    return cleanup;
  }, []);

  return null; // This component doesn't render anything
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

// Utility function for debouncing with improved performance
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// HOC for memoizing components with shallow comparison
export function withShallowMemo<T extends React.ComponentType<any>>(
  Component: T
): React.MemoExoticComponent<T> {
  return memo(Component, (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    
    return prevKeys.every(key => prevProps[key] === nextProps[key]);
  });
}

// Enhanced hook for monitoring component render performance
export function useRenderTracker(componentName: string) {
  const renderStartTime = useRef(performance.now());
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    renderCountRef.current++;
    
    // Enhanced logging with component-specific tracking
    if (process.env.NODE_ENV === 'development') {
      if (renderTime > 100) {
        logger.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`);
        
        // Suggest optimizations for consistently slow components
        if (renderCountRef.current > 3) {
          logger.info(`💡 ${componentName} has rendered ${renderCountRef.current} times. Consider:`, {
            suggestions: [
              'Add React.memo if props don\'t change frequently',
              'Use useMemo for expensive calculations',
              'Check for unnecessary re-renders with React DevTools',
              'Consider code splitting for large components'
            ]
          });
        }
      }
      
      // Track re-render frequency
      if (renderCountRef.current > 10) {
        logger.warn(`🔄 Frequent re-renders: ${componentName} has rendered ${renderCountRef.current} times`);
      }
    }
  });
}

// Enhanced hook for optimizing re-renders with performance tracking
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>();
  const callCountRef = useRef(0);
  
  useEffect(() => {
    ref.current = callback;
    callCountRef.current = 0; // Reset call count when deps change
  }, deps);
  
  return useCallback((...args: Parameters<T>) => {
    callCountRef.current++;
    
    // Track callback usage in development
    if (process.env.NODE_ENV === 'development' && callCountRef.current > 100) {
      logger.info(`🔄 High callback usage: useStableCallback called ${callCountRef.current} times`);
    }
    
    return ref.current?.(...args);
  }, []) as T;
}

// New hook for monitoring query performance
export function useQueryPerformanceTracker(queryKey: string, isLoading: boolean, data: any) {
  const startTimeRef = useRef<number>();
  
  useEffect(() => {
    if (isLoading && !startTimeRef.current) {
      startTimeRef.current = performance.now();
    } else if (!isLoading && startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      startTimeRef.current = undefined;
      
      if (process.env.NODE_ENV === 'development') {
        if (duration > 2000) {
          logger.warn(`🐌 Slow query: ${queryKey} took ${duration.toFixed(2)}ms`);
          logger.info(`💡 Consider: caching, pagination, or query optimization for ${queryKey}`);
        }
        
        if (data && Array.isArray(data) && data.length > 100) {
          logger.info(`📊 Large dataset: ${queryKey} returned ${data.length} items. Consider pagination.`);
        }
      }
    }
  }, [isLoading, queryKey, data]);
}
