/**
 * Safe performance optimizations that don't break functionality
 * Focus on non-intrusive optimizations that enhance performance without side effects
 */

// Browser detection (safe subset)
export const detectBrowser = () => {
  const ua = navigator.userAgent;
  return {
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isMobile: /Mobi|Android/i.test(ua),
    isSafari: /Safari/.test(ua) && !/Chrome|Chromium/.test(ua),
    isChrome: /Chrome/.test(ua) && !/Edg|Opera|OPR/.test(ua),
    supportsWebP: () => {
      try {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } catch {
        return false;
      }
    }
  };
};

// Safe mobile optimizations (no CSS containment or transforms)
export const applySafeMobileOptimizations = () => {
  const browser = detectBrowser();
  
  if (browser.isMobile) {
    // Safe touch optimizations
    document.body.style.touchAction = 'manipulation';
    
    // iOS viewport fix
    if (browser.isIOS) {
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', () => {
        setTimeout(setVH, 100);
      });
    }
    
    // Android keyboard handling
    if (browser.isAndroid) {
      let initialHeight = window.innerHeight;
      window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        if (heightDiff > 150 && document.activeElement) {
          const active = document.activeElement as HTMLElement;
          if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
            setTimeout(() => {
              active.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }
        }
      });
    }
  }
  
  // Add browser classes for CSS targeting
  document.documentElement.classList.add(
    browser.isMobile ? 'mobile' : 'desktop',
    browser.isIOS ? 'ios' : '',
    browser.isAndroid ? 'android' : '',
    browser.isSafari ? 'safari' : '',
    browser.isChrome ? 'chrome' : ''
  );
};

// Safe resource optimization
export const optimizeResources = () => {
  // Preconnect to critical domains
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
  
  // DNS prefetch for additional performance
  const prefetchDomains = [
    '//cdn.jsdelivr.net'
  ];
  
  prefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Safe font optimization
export const optimizeFonts = () => {
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });
  }
  
  // Add font-display: swap to existing font links
  const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
  fontLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.includes('display=swap')) {
      const separator = href.includes('?') ? '&' : '?';
      link.setAttribute('href', `${href}${separator}display=swap`);
    }
  });
};

// Initialize all safe optimizations
export const initializeSafeOptimizations = () => {
  const initialize = () => {
    applySafeMobileOptimizations();
    optimizeResources();
    optimizeFonts();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
};