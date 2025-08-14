// Enhanced performance optimizations following mobile guidelines

export const initializePerformanceOptimizations = () => {
  // Optimize font loading
  optimizeFontLoading();
  
  // Add mobile-specific optimizations
  if (isMobileDevice()) {
    addMobileOptimizations();
  }
  
  // Add resource hints
  addCriticalResourceHints();
  
  // Optimize scroll performance
  optimizeScrollPerformance();
};

const optimizeFontLoading = () => {
  // Add font-display: swap to existing Google Fonts
  const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
  fontLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.includes('display=swap')) {
      const separator = href.includes('?') ? '&' : '?';
      link.setAttribute('href', `${href}${separator}display=swap`);
    }
  });
  
  // Add fonts-loaded class when ready
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
};

const isMobileDevice = () => {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const addMobileOptimizations = () => {
  // Add mobile class for CSS targeting
  document.documentElement.classList.add('mobile');
  
  // Optimize viewport height for mobile browsers
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVH();
  window.addEventListener('resize', setVH, { passive: true });
  window.addEventListener('orientationchange', setVH, { passive: true });
  
  // Improve touch performance
  document.documentElement.style.touchAction = 'manipulation';
  
  // Add platform-specific classes
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.documentElement.classList.add('ios');
  }
  if (/Android/i.test(navigator.userAgent)) {
    document.documentElement.classList.add('android');
  }
};

const addCriticalResourceHints = () => {
  const hints = [
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://wrvvlmevpvcenauglcyz.supabase.co', crossOrigin: 'anonymous' },
  ];
  
  hints.forEach(({ rel, href, crossOrigin }) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
  });
};

const optimizeScrollPerformance = () => {
  // Use passive listeners for scroll events
  let ticking = false;
  
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('touchstart', () => {}, { passive: true });
  window.addEventListener('touchmove', () => {}, { passive: true });
};

// Image optimization helpers
export const getOptimizedImageProps = (
  src: string, 
  alt: string, 
  width: number, 
  height: number,
  priority = false
) => {
  return {
    src,
    alt,
    width,
    height,
    loading: priority ? 'eager' : 'lazy' as const,
    decoding: 'async' as const,
    fetchPriority: priority ? 'high' : 'auto' as const,
    style: { 
      aspectRatio: `${width}/${height}`,
      maxWidth: '100%',
      height: 'auto'
    }
  };
};

// Content visibility helper
export const getContentVisibilityStyles = (estimatedHeight: number) => ({
  contentVisibility: 'auto' as const,
  containIntrinsicSize: `0 ${estimatedHeight}px`
});