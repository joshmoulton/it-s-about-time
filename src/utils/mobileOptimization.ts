// Mobile performance optimizations
export const optimizeForMobile = () => {
  // Disable animations on mobile for better performance
  if (window.innerWidth <= 768) {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add passive event listeners for better scroll performance
  if ('addEventListener' in window) {
    window.addEventListener('touchstart', () => {}, { passive: true });
    window.addEventListener('touchmove', () => {}, { passive: true });
    window.addEventListener('wheel', () => {}, { passive: true });
  }
  
  // Optimize viewport height on mobile
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
};

// Call optimization on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeForMobile);
  } else {
    optimizeForMobile();
  }
}