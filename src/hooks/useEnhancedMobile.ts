
import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}

export function useEnhancedMobile() {
  const isMobile = useIsMobile();
  const [isLandscape, setIsLandscape] = useState(false);
  const [touchSupport, setTouchSupport] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [currentGesture, setCurrentGesture] = useState<TouchGesture | null>(null);

  useEffect(() => {
    // Import browser optimization utilities
    import('../utils/browserOptimization').then(({ getBrowserInfo, initializeBrowserOptimizations }) => {
      const browser = getBrowserInfo();
      setBrowserInfo(browser);
      
      // Initialize browser optimizations
      initializeBrowserOptimizations();
    });

    const checkOrientation = () => {
      // Use both methods for better compatibility
      const isLandscapeBySize = window.innerWidth > window.innerHeight;
      const isLandscapeByOrientation = window.screen?.orientation?.angle === 90 || window.screen?.orientation?.angle === 270;
      setIsLandscape(isLandscapeBySize || isLandscapeByOrientation);
    };

    const checkTouchSupport = () => {
      // Multiple methods for better browser compatibility
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch;
      setTouchSupport(hasTouch);
    };

    checkOrientation();
    checkTouchSupport();

    // Use both orientationchange and resize for better compatibility
    window.addEventListener('orientationchange', () => {
      // Delay check for iOS compatibility
      setTimeout(checkOrientation, 100);
    });
    window.addEventListener('resize', checkOrientation);

    return () => {
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setCurrentGesture({
        startX: touch.clientX,
        startY: touch.clientY,
        endX: touch.clientX,
        endY: touch.clientY,
        duration: Date.now()
      });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (currentGesture && e.touches.length === 1) {
      const touch = e.touches[0];
      setCurrentGesture(prev => prev ? {
        ...prev,
        endX: touch.clientX,
        endY: touch.clientY
      } : null);
    }
  };

  const handleTouchEnd = () => {
    if (currentGesture) {
      const gesture = {
        ...currentGesture,
        duration: Date.now() - currentGesture.duration
      };
      
      // Process gesture (swipe detection, etc.)
      const deltaX = gesture.endX - gesture.startX;
      const deltaY = gesture.endY - gesture.startY;
      const isSwipe = Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50;
      
      if (isSwipe && gesture.duration < 300) {
        // Handle swipe gesture
        const direction = Math.abs(deltaX) > Math.abs(deltaY) 
          ? (deltaX > 0 ? 'right' : 'left')
          : (deltaY > 0 ? 'down' : 'up');
        
        // Could emit custom events or callbacks here
        console.log(`Swipe detected: ${direction}`);
      }
      
      setCurrentGesture(null);
    }
  };

  const getMobileClasses = () => {
    const classes = [];
    if (isMobile) classes.push('mobile-optimized');
    if (isLandscape) classes.push('landscape-mode');
    if (touchSupport) classes.push('touch-enabled');
    
    // Add browser-specific classes
    if (browserInfo) {
      if (browserInfo.isIOS) classes.push('ios-device');
      if (browserInfo.isAndroid) classes.push('android-device');
      if (browserInfo.isSafari) classes.push('safari-browser');
      if (browserInfo.isChrome) classes.push('chrome-browser');
      if (browserInfo.isFirefox) classes.push('firefox-browser');
      if (browserInfo.isEdge) classes.push('edge-browser');
      if (browserInfo.isOpera) classes.push('opera-browser');
      if (browserInfo.isBrave) classes.push('brave-browser');
      if (browserInfo.getDevicePixelRatio() > 1) classes.push('high-dpi');
    }
    
    return classes.join(' ');
  };

  const getOptimalLayout = () => {
    if (!isMobile) return 'desktop';
    if (isLandscape) return 'mobile-landscape';
    return 'mobile-portrait';
  };

  const getBrowserCapabilities = () => {
    if (!browserInfo) return {};
    return {
      supportsWebP: browserInfo.supportsWebP(),
      supportsAvif: browserInfo.supportsAvif?.() || false,
      supportsWebGL: browserInfo.supportsWebGL?.() || false,
      supportsTouchEvents: browserInfo.supportsTouchEvents?.() || false,
      supportsHover: browserInfo.supportsHover?.() || false,
      devicePixelRatio: browserInfo.getDevicePixelRatio?.() || 1,
      viewportSize: browserInfo.getViewportSize?.() || { width: 0, height: 0 }
    };
  };

  const isSpecificBrowser = (browser: string) => {
    if (!browserInfo) return false;
    switch (browser.toLowerCase()) {
      case 'chrome': return browserInfo.isChrome;
      case 'safari': return browserInfo.isSafari;
      case 'firefox': return browserInfo.isFirefox;
      case 'edge': return browserInfo.isEdge;
      case 'opera': return browserInfo.isOpera;
      case 'brave': return browserInfo.isBrave;
      case 'ios': return browserInfo.isIOS;
      case 'android': return browserInfo.isAndroid;
      default: return false;
    }
  };

  return {
    isMobile,
    isLandscape,
    touchSupport,
    browserInfo,
    currentGesture,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getMobileClasses,
    getOptimalLayout,
    getBrowserCapabilities,
    isSpecificBrowser
  };
}
