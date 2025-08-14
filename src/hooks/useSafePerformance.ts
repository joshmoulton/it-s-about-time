import { useEffect, useCallback } from 'react';

export const useSafePerformance = () => {
  // Safe image lazy loading with intersection observer
  const setupLazyLoading = useCallback(() => {
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

  // Safe scroll optimization (no transforms or containment)
  const setupScrollOptimization = useCallback(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Safe scroll handling - no DOM manipulation
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Viewport height fix for mobile (safe version)
  const setupViewportFix = useCallback(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH, { passive: true });
    window.addEventListener('orientationchange', setVH, { passive: true });
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  useEffect(() => {
    const cleanupFunctions: Array<() => void> = [];

    // Apply safe optimizations
    const imageCleanup = setupLazyLoading();
    const scrollCleanup = setupScrollOptimization();
    const viewportCleanup = setupViewportFix();
    
    if (imageCleanup) cleanupFunctions.push(imageCleanup);
    if (scrollCleanup) cleanupFunctions.push(scrollCleanup);
    if (viewportCleanup) cleanupFunctions.push(viewportCleanup);

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [setupLazyLoading, setupScrollOptimization, setupViewportFix]);
};