import { useCallback, useRef } from 'react';

// Rate limiter hook to prevent excessive API calls
export function useRateLimiter(delay: number = 1000) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledFunction = useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return (...args: Parameters<T>): Promise<ReturnType<T>> => {
        return new Promise((resolve) => {
          const now = Date.now();
          const timeSinceLastCall = now - lastCallRef.current;
          
          if (timeSinceLastCall >= delay) {
            // Can call immediately
            lastCallRef.current = now;
            resolve(fn(...args));
          } else {
            // Need to wait
            const remainingDelay = delay - timeSinceLastCall;
            
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
              lastCallRef.current = Date.now();
              resolve(fn(...args));
            }, remainingDelay);
          }
        });
      };
    },
    [delay]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { throttledFunction, cleanup };
}

// Debounce hook to prevent rapid successive calls
export function useDebounce() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback(
    <T extends (...args: any[]) => any>(fn: T, delay: number = 500) => {
      return (...args: Parameters<T>): void => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          fn(...args);
        }, delay);
      };
    },
    []
  );

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debouncedFunction, cleanup };
}