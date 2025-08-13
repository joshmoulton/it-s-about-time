import { useEffect } from 'react';

export const MobileTouchOptimizer = () => {
  useEffect(() => {
    // Optimize touch interactions for mobile
    const optimizeTouchPerformance = () => {
      // Add touch-action CSS for better scroll performance
      const style = document.createElement('style');
      style.textContent = `
        /* Optimize touch scrolling */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        .scroll-container {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        /* Improve button touch targets */
        button, [role="button"] {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }
        
        /* Prevent zoom on inputs */
        input, select, textarea {
          font-size: 16px;
        }
        
        /* Optimize animations for mobile */
        @media (prefers-reduced-motion: no-preference) {
          * {
            will-change: auto;
          }
        }
      `;
      document.head.appendChild(style);
    };

    // Apply optimizations
    if ('ontouchstart' in window) {
      optimizeTouchPerformance();
    }
  }, []);

  return null;
};