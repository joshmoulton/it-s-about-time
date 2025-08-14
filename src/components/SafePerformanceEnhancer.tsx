import { useEffect } from 'react';

interface SafePerformanceEnhancerProps {
  children: React.ReactNode;
}

export const SafePerformanceEnhancer = ({ children }: SafePerformanceEnhancerProps) => {
  useEffect(() => {
    // Safe optimizations that don't break functionality
    const applyOptimizations = () => {
      // 1. Safe scroll optimization (NO CSS containment)
      if ('scrollBehavior' in document.documentElement.style) {
        document.documentElement.style.scrollBehavior = 'smooth';
      }
      
      // 2. Resource hints for critical domains
      const domains = [
        'https://wrvvlmevpvcenauglcyz.supabase.co',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ];
      
      domains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
      
      // 3. Font optimization
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          document.body.classList.add('fonts-loaded');
        });
      }
      
      // 4. Connection-aware optimizations
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
          document.documentElement.classList.add('slow-connection');
        }
        if (connection?.saveData) {
          document.documentElement.classList.add('save-data');
        }
      }
      
      // 5. Reduced motion support
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduce-motion');
      }
    };

    // Apply optimizations after DOM is ready
    if (document.readyState === 'complete') {
      applyOptimizations();
    } else {
      window.addEventListener('load', applyOptimizations, { once: true });
    }

    return () => {
      window.removeEventListener('load', applyOptimizations);
    };
  }, []);

  // Render children immediately - no blocking
  return <>{children}</>;
};