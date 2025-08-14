/**
 * Browser detection and optimization utilities
 * Ensures consistent behavior across Chrome, Safari, Firefox, Edge, Brave, and mobile browsers
 */
import { warn as logWarn } from '@/utils/productionLogger'

// Comprehensive browser detection utilities
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor;
  
  // Enhanced browser detection
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(vendor) && !/Edg|Opera|OPR/.test(ua);
  const isSafari = /Safari/.test(ua) && /Apple Computer/.test(vendor) && !/Chrome|Chromium/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isOpera = /OPR/.test(ua) || /Opera/.test(ua);
  const isBrave = (navigator as any).brave !== undefined && (navigator as any).brave.isBrave !== undefined;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMobile = /Mobi|Android/i.test(ua);
  const isDesktop = !isMobile;
  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(ua);
  const isWindows = /Win32|Win64|Windows|WinCE/.test(ua);
  const isLinux = /Linux/.test(ua) && !/Android/.test(ua);

  // Feature detection
  const supportsWebP = () => {
    try {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  };

  const supportsAvif = () => {
    try {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  };

  const supportsWebGL = () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  };

  const supportsTouchEvents = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  const supportsHover = () => {
    return window.matchMedia('(hover: hover)').matches;
  };

  const getViewportSize = () => {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  };

  const getDevicePixelRatio = () => {
    return window.devicePixelRatio || 1;
  };

  return {
    isChrome,
    isSafari,
    isFirefox,
    isEdge,
    isOpera,
    isBrave,
    isIOS,
    isAndroid,
    isMobile,
    isDesktop,
    isMac,
    isWindows,
    isLinux,
    supportsWebP,
    supportsAvif,
    supportsWebGL,
    supportsTouchEvents,
    supportsHover,
    getViewportSize,
    getDevicePixelRatio,
    version: {
      chrome: isChrome ? ua.match(/Chrome\/(\d+)/)?.[1] : null,
      safari: isSafari ? ua.match(/Version\/(\d+)/)?.[1] : null,
      firefox: isFirefox ? ua.match(/Firefox\/(\d+)/)?.[1] : null,
      edge: isEdge ? ua.match(/Edg\/(\d+)/)?.[1] : null
    }
  };
};

// Comprehensive browser optimization
export const optimizeForBrowser = () => {
  const browser = getBrowserInfo();

  // Performance optimizations based on connection
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      // Disable heavy animations on slow connections
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        document.documentElement.classList.add('reduced-motion');
      }
      
      // Reduce data usage on limited connections
      if (connection.saveData) {
        document.documentElement.classList.add('save-data');
      }
    }
  }

  // iOS Safari specific optimizations
  if (browser.isIOS) {
    // Fix iOS viewport height issue (100vh problem)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100); // Delay for iOS orientation change
    });

    // Prevent iOS bounce scroll
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';
    
    // Fix iOS Safari scrolling issues
    document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
    
    // Fix iOS Safari input zoom
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const element = input as HTMLElement;
      element.style.fontSize = Math.max(16, parseInt(getComputedStyle(element).fontSize)) + 'px';
    });
    
    // Fix iOS Safari backdrop-filter support
    if (CSS.supports('backdrop-filter', 'blur(10px)')) {
      document.documentElement.classList.add('supports-backdrop-filter');
    }
  }

  // Android optimizations
  if (browser.isAndroid) {
    // Improve scrolling performance
    document.documentElement.style.overscrollBehavior = 'none';
    
    // Fix Android keyboard resize issues
    let initialViewportHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Likely keyboard opened if height reduced significantly
      if (heightDifference > 150 && document.activeElement) {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
          setTimeout(() => {
            activeElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }, 300);
        }
      }
    });
    
    // Fix Android Chrome address bar height changes
    const setAndroidVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh-android', `${vh}px`);
    };
    setAndroidVH();
    window.addEventListener('resize', setAndroidVH);
  }

  // Firefox specific optimizations
  if (browser.isFirefox) {
    // Improve font rendering
    document.documentElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
    
    // Fix Firefox scrollbar styling
    document.documentElement.style.scrollbarWidth = 'thin';
    
    // Fix Firefox flexbox bugs
    document.documentElement.classList.add('firefox-flex-fix');
  }

  // Safari specific optimizations (all Safari, not just iOS)
  if (browser.isSafari) {
    // Improve font rendering
    document.documentElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
    document.documentElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
    
    // Fix Safari form styling
    const styleInputs = () => {
      const inputs = document.querySelectorAll('input, textarea, select, button');
      inputs.forEach(input => {
        const element = input as HTMLElement;
        element.style.webkitAppearance = 'none';
        element.style.borderRadius = '0';
      });
    };
    styleInputs();
    
    // Re-apply styles for dynamically added elements
    const observer = new MutationObserver(styleInputs);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Fix Safari date input
    const dateInputs = document.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="time"]');
    dateInputs.forEach(input => {
      (input as HTMLElement).style.webkitAppearance = 'none';
    });
  }

  // Chrome specific optimizations (SAFE - no transforms)
  if (browser.isChrome) {
    // Removed hardware acceleration to prevent modal issues
    
    // Fix Chrome autofill styling
    const style = document.createElement('style');
    style.textContent = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-text-fill-color: var(--foreground) !important;
        -webkit-box-shadow: 0 0 0px 1000px var(--background) inset !important;
        transition: background-color 5000s ease-in-out 0s !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Edge specific optimizations
  if (browser.isEdge) {
    // Fix Edge CSS Grid issues
    document.documentElement.classList.add('edge-grid-fix');
    
    // Improve Edge font rendering
    document.documentElement.style.setProperty('-ms-text-size-adjust', '100%');
  }

  // Opera specific optimizations
  if (browser.isOpera) {
    // Fix Opera specific issues
    document.documentElement.classList.add('opera-optimized');
  }

  // Brave specific optimizations
  if (browser.isBrave) {
    // Brave inherits Chrome optimizations but may block some features
    document.documentElement.classList.add('brave-optimized');
  }

  // General mobile optimizations (SAFE - minimal interference)
  if (browser.isMobile) {
    // Safe touch optimizations
    document.body.style.touchAction = 'manipulation';
    (document.body.style as any).webkitTouchCallout = 'none';
    (document.body.style as any).webkitTapHighlightColor = 'transparent';
    
    // Allow text selection in input elements without complex observers
    const textElements = document.querySelectorAll('input, textarea, [contenteditable]');
    textElements.forEach(element => {
      const elementStyle = (element as HTMLElement).style as any;
      elementStyle.webkitUserSelect = 'text';
      (element as HTMLElement).style.userSelect = 'text';
    });
  }

  // High DPI display optimizations
  if (browser.getDevicePixelRatio() > 1) {
    document.documentElement.classList.add('high-dpi');
  }

  // Add browser classes for CSS targeting
  const html = document.documentElement;
  if (browser.isChrome) html.classList.add('chrome');
  if (browser.isSafari) html.classList.add('safari');
  if (browser.isFirefox) html.classList.add('firefox');
  if (browser.isEdge) html.classList.add('edge');
  if (browser.isOpera) html.classList.add('opera');
  if (browser.isBrave) html.classList.add('brave');
  if (browser.isIOS) html.classList.add('ios');
  if (browser.isAndroid) html.classList.add('android');
  if (browser.isMobile) html.classList.add('mobile');
  if (browser.isDesktop) html.classList.add('desktop');
  if (browser.isMac) html.classList.add('mac');
  if (browser.isWindows) html.classList.add('windows');
  if (browser.isLinux) html.classList.add('linux');

  return browser;
};

// Smooth scroll polyfill for older browsers
export const enableSmoothScrolling = () => {
  // Simply enable CSS smooth scrolling - let our custom utility handle the rest
  document.documentElement.style.scrollBehavior = 'smooth';
};

// Image optimization based on browser support
export const optimizeImages = () => {
  const browser = getBrowserInfo();
  
  // Convert images to WebP if supported
  if (browser.supportsWebP()) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src && !src.includes('.webp')) {
        // In a real implementation, you'd have WebP versions
        // For now, we'll use the original format
        img.setAttribute('src', src);
      }
    });
  }

  // Lazy loading for older browsers
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.setAttribute('src', src);
      }
    });
  }
};

// CSS polyfills and feature detection
export const addCSSPolyfills = () => {
  const browser = getBrowserInfo();
  
  // Add CSS custom properties fallback for older browsers
  if (!CSS.supports('color', 'var(--test)')) {
    document.documentElement.classList.add('no-css-custom-properties');
  }
  
  // Add CSS Grid fallback detection
  if (!CSS.supports('display', 'grid')) {
    document.documentElement.classList.add('no-css-grid');
  }
  
  // Add Flexbox gap support detection
  if (!CSS.supports('gap', '1rem')) {
    document.documentElement.classList.add('no-flexbox-gap');
  }
  
  // Add backdrop-filter support detection
  if (!CSS.supports('backdrop-filter', 'blur(10px)')) {
    document.documentElement.classList.add('no-backdrop-filter');
  }
  
  // Add position: sticky support detection
  if (!CSS.supports('position', 'sticky')) {
    document.documentElement.classList.add('no-position-sticky');
  }
};

// Event listener polyfills
export const addEventPolyfills = () => {
  // Passive event listener support
  let passiveSupported = false;
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      }
    };
    window.addEventListener('testpassive' as any, () => {}, options as any);
    window.removeEventListener('testpassive' as any, () => {}, options as any);
  } catch {
    passiveSupported = false;
  }
  
  if (!passiveSupported) {
    document.documentElement.classList.add('no-passive-events');
  }
  
  // Pointer events polyfill detection
  if (!(window as any).PointerEvent) {
    document.documentElement.classList.add('no-pointer-events');
  }
};

// Initialize all optimizations
export const initializeBrowserOptimizations = () => {
  // Wait for DOM to be ready
  const initialize = () => {
    optimizeForBrowser();
    enableSmoothScrolling();
    optimizeImages();
    addCSSPolyfills();
    addEventPolyfills();
    monitorPerformance();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
};

// Performance monitoring
export const monitorPerformance = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 200) {
          logWarn(`Slow performance detected: ${entry.name} took ${entry.duration}ms`)
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }
};
