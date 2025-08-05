import { useEffect, useState } from 'react';

interface PerformanceEnhancerProps {
  children: React.ReactNode;
}

export const PerformanceEnhancer = ({ children }: PerformanceEnhancerProps) => {
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    // Optimize browser performance
    const optimizePerformance = () => {
      // 1. Reduce reflow/repaint by batching DOM updates
      if (document.readyState === 'complete') {
        // Enable CSS containment for better performance
        document.documentElement.style.contain = 'layout style paint';
        
        // Optimize scroll performance
        if ('scrollBehavior' in document.documentElement.style) {
          document.documentElement.style.scrollBehavior = 'smooth';
        }
        
        // Preload critical resources
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        if (preloadLinks.length === 0) {
          // Add preload for common assets
          const preload = document.createElement('link');
          preload.rel = 'preload';
          preload.as = 'font';
          preload.crossOrigin = 'anonymous';
          document.head.appendChild(preload);
        }
        
        setIsOptimized(true);
      }
    };

    // Run optimization after component mount
    if (document.readyState === 'complete') {
      optimizePerformance();
    } else {
      window.addEventListener('load', optimizePerformance, { once: true });
    }

    // Cleanup
    return () => {
      window.removeEventListener('load', optimizePerformance);
    };
  }, []);

  // Only render children after optimization
  if (!isOptimized && document.readyState !== 'complete') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};