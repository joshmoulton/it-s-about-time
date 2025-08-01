// Production-safe logging utility that prevents console logging in production
// This helps prevent PostHog rate limiting from excessive console output

const isDevelopment = import.meta.env.DEV;

// Only log in development or when explicitly enabled
const shouldLog = (): boolean => {
  if (isDevelopment) return true;
  
  // Check for debug parameter
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') return true;
  }
  
  return false;
};

export const productionLogger = {
  log: (...args: any[]) => {
    if (shouldLog()) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (shouldLog()) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (shouldLog()) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (shouldLog()) {
      console.info(...args);
    }
  }
};

// Export for convenience
export const { log, error, warn, info } = productionLogger;