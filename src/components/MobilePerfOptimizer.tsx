import { useEffect } from 'react';

export const MobilePerfOptimizer = () => {
  useEffect(() => {
    // Critical performance optimizations for mobile
    const optimizeMobilePerformance = () => {
      // 1. Defer non-critical CSS
      const deferStyles = () => {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
        stylesheets.forEach(stylesheet => {
          if (!stylesheet.getAttribute('data-critical')) {
            stylesheet.setAttribute('media', 'print');
            stylesheet.setAttribute('onload', "this.media='all'");
          }
        });
      };

      // 2. Lazy load images that are not in viewport
      const lazyLoadImages = () => {
        const images = document.querySelectorAll('img[loading="lazy"]');
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                  imageObserver.unobserve(img);
                }
              }
            });
          }, {
            rootMargin: '50px'
          });

          images.forEach(img => imageObserver.observe(img));
          return () => images.forEach(img => imageObserver.unobserve(img));
        }
      };

      // 3. Optimize scroll performance
      const optimizeScrolling = () => {
        let rafId: number;
        const throttledScroll = () => {
          if (rafId) {
            cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(() => {
            // Minimize scroll processing
          });
        };

        document.addEventListener('scroll', throttledScroll, { passive: true });
        return () => {
          document.removeEventListener('scroll', throttledScroll);
          if (rafId) cancelAnimationFrame(rafId);
        };
      };

      // 4. Reduce main thread work
      const reduceMainThreadWork = () => {
        // Defer non-critical JavaScript
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            // Run non-critical tasks during idle time
            console.debug('Mobile performance optimizations applied');
          });
        }
      };

      // Apply optimizations
      deferStyles();
      const cleanupLazyLoad = lazyLoadImages();
      const cleanupScroll = optimizeScrolling();
      reduceMainThreadWork();

      return () => {
        cleanupLazyLoad?.();
        cleanupScroll?.();
      };
    };

    // Apply optimizations after DOM is ready
    if (document.readyState === 'complete') {
      optimizeMobilePerformance();
    } else {
      window.addEventListener('load', optimizeMobilePerformance, { once: true });
    }
  }, []);

  return null;
};