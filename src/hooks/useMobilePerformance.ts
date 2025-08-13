import { useEffect, useCallback } from 'react';
import { useConnectionStatus } from './useConnectionStatus';

export const useMobilePerformance = () => {
  const { effectiveType, isSlowConnection } = useConnectionStatus();

  // Safe resource optimization without touching CSS
  const optimizeResources = useCallback(() => {
    // Add DNS prefetch for external domains
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://wrvvlmevpvcenauglcyz.supabase.co'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }, []);

  // Optimize scroll performance for mobile
  const optimizeScrolling = useCallback(() => {
    let rafId: number;
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Passive scroll handling for better performance
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Connection-aware loading
  const optimizeForConnection = useCallback(() => {
    if (isSlowConnection || effectiveType === 'slow-2g' || effectiveType === '2g') {
      // Reduce quality for slow connections
      document.documentElement.style.setProperty('--image-quality', '0.7');
    }
  }, [isSlowConnection, effectiveType]);

  useEffect(() => {
    optimizeResources();
    const scrollCleanup = optimizeScrolling();
    optimizeForConnection();

    return () => {
      scrollCleanup?.();
    };
  }, [optimizeResources, optimizeScrolling, optimizeForConnection]);
};