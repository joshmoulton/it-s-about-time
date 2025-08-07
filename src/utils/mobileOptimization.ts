// Enhanced mobile optimization utilities
export const optimizeForMobile = () => {
  // Critical performance optimizations
  if (typeof window !== 'undefined') {
    // Set viewport height variable for mobile browsers
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Optimize font loading
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    }
    
    // Preload critical images with high priority
    const criticalImages = [
      'https://wrvvlmevpvcenauglcyz.supabase.co/storage/v1/object/public/assets/Property%201=Black%20(3).png',
      '/lovable-uploads/a8eaa39b-22e5-4a3c-a288-fe43b8619eab.png'
    ];
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if ('fetchPriority' in link) {
        (link as any).fetchPriority = 'high';
      }
      document.head.appendChild(link);
    });
    
    // Optimize touch interactions with passive listeners
    window.addEventListener('touchstart', () => {}, { passive: true });
    window.addEventListener('touchmove', () => {}, { passive: true });
    window.addEventListener('touchend', () => {}, { passive: true });
    window.addEventListener('wheel', () => {}, { passive: true });
    
    // Optimize scrolling performance with RAF throttling
    let ticking = false;
    const optimizeScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', optimizeScroll, { passive: true });
    
    // Battery and performance optimization for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.classList.add('reduce-motion');
    }
    
    // Network-aware optimizations
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          document.documentElement.classList.add('slow-connection');
          // Disable heavy animations on slow connections
          const style = document.createElement('style');
          style.textContent = `
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              transition-duration: 0.1s !important;
            }
          `;
          document.head.appendChild(style);
        }
      }
    }
    
    // Mobile-specific optimizations
    if (window.innerWidth <= 768) {
      document.body.classList.add('mobile');
      
      // Reduce animations on mobile for better performance
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 768px) {
          *, *::before, *::after {
            animation-duration: 0.1s !important;
            transition-duration: 0.1s !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Platform-specific optimizations
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.body.classList.add('ios');
      // iOS-specific optimizations
      document.documentElement.style.webkitTextSizeAdjust = '100%';
    }
    
    if (/Android/.test(navigator.userAgent)) {
      document.body.classList.add('android');
      // Android-specific optimizations
      document.documentElement.style.textRendering = 'optimizeSpeed';
    }
  }
};