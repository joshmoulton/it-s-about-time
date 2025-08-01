
// Production security hardening utilities
import { isDevelopment, logger } from './secureLogger';

// Initialize production security measures  
export const initProductionSecurity = () => {
  if (!isDevelopment) {
    // Disable console logs in production unless debug mode is enabled
    logger.disableDebugMode();
    
    // Hide development tools access in production
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, '__debugMode', {
        value: {
          enable: () => logger.enableDebugMode(),
          disable: () => logger.disableDebugMode(),
          status: () => logger.shouldLog?.() || false
        },
        writable: false,
        configurable: false
      });
    }
  }
};
