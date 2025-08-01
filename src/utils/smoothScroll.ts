/**
 * Enhanced smooth scrolling utility with better performance and easing
 */

interface SmoothScrollOptions {
  duration?: number;
  offset?: number;
  easing?: (t: number) => number;
}

// Better easing function for smoother animation
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const smoothScrollTo = (target: Element | string, options: SmoothScrollOptions = {}) => {
  const {
    duration = 800,
    offset = 80,
    easing = easeInOutCubic
  } = options;

  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();

  // Use native smooth scroll if available and distance is reasonable
  if ('scrollBehavior' in document.documentElement.style && Math.abs(distance) < 3000) {
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    return;
  }

  // Custom smooth scroll for better control
  const scroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    
    window.scrollTo(0, startPosition + distance * easedProgress);

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};

// Enhanced scroll event handler with throttling
export const createScrollHandler = (callback: (scrollProgress: number) => void) => {
  let ticking = false;

  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        // Make the progress bar fill more gradually by using a slower easing
        const rawProgress = scrollTop / docHeight;
        const easedProgress = Math.pow(rawProgress, 0.7); // Slower initial fill, accelerates towards end
        const scrollProgress = Math.min(easedProgress * 100, 100);
        
        callback(scrollProgress);
        ticking = false;
      });
      ticking = true;
    }
  };
};


// Disable conflicting smooth scroll polyfills
export const optimizeScrolling = () => {
  // Ensure CSS smooth scrolling is enabled
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Optimize for better performance
  if ('CSS' in window && 'supports' in window.CSS) {
    if (window.CSS.supports('scroll-behavior', 'smooth')) {
      // Native smooth scrolling is supported, disable any polyfills
      return true;
    }
  }
  
  return false;
};