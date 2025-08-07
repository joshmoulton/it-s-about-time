import { useEffect, useCallback } from 'react';

export const usePerformanceOptimization = () => {
  // Optimize images with intersection observer
  const optimizeImages = useCallback(() => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.add('loaded');
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.1
      });

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });

      return () => imageObserver.disconnect();
    }
  }, []);

  // Preload critical resources
  const preloadCriticalResources = useCallback(() => {
    const criticalResources = [
      { href: '/src/App.tsx', as: 'script' },
      { href: '/lovable-uploads/97f86327-e463-4091-8474-4f835ee7556f.png', as: 'image' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.as === 'image') {
        link.fetchPriority = 'high';
      }
      document.head.appendChild(link);
    });
  }, []);

  // Optimize scroll performance
  const optimizeScrolling = useCallback(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Scroll optimizations here
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply performance optimizations
  useEffect(() => {
    const cleanupFunctions: Array<() => void> = [];

    // Run optimizations
    const imageCleanup = optimizeImages();
    const scrollCleanup = optimizeScrolling();
    
    if (imageCleanup) cleanupFunctions.push(imageCleanup);
    if (scrollCleanup) cleanupFunctions.push(scrollCleanup);
    
    preloadCriticalResources();

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [optimizeImages, optimizeScrolling, preloadCriticalResources]);
};