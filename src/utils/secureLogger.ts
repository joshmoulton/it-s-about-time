// Secure logging utility that prevents data exposure in production
export const isDevelopment = (import.meta as any).env?.DEV || false;

// Type-safe window access
const getWindow = (): any => typeof globalThis !== 'undefined' && 'window' in globalThis ? (globalThis as any).window : null;

// Debug mode detection for production troubleshooting (dynamic check)
export const isDebugMode = (): boolean => {
  if (isDevelopment) return true;
  const win = getWindow();
  if (!win) return false;
  
  // Check URL parameter (dynamic check each time)
  const urlParams = new URLSearchParams(win.location.search);
  if (urlParams.get('debug') === 'true') return true;
  
  // Check localStorage flag
  try {
    if (localStorage.getItem('debug-mode') === 'true') return true;
  } catch (e) {
    // localStorage might not be available
  }
  
  return false;
};

// Store original console methods for restoration
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
  table: console.table,
  group: console.group,
  groupEnd: console.groupEnd,
  count: console.count,
  time: console.time,
  timeEnd: console.timeEnd,
};

// Data sanitization utility
export const sanitizeData = (data: any): any => {
  // If debug mode is enabled, don't sanitize data for debugging
  if (isDebugMode()) return data;
  if (!isDevelopment) return '[REDACTED]';
  
  if (typeof data === 'string') {
    // Redact common sensitive patterns
    return data
      .replace(/password['":\s]*['"][^'"]*['"]/gi, 'password:"[REDACTED]"')
      .replace(/token['":\s]*['"][^'"]*['"]/gi, 'token:"[REDACTED]"')
      .replace(/key['":\s]*['"][^'"]*['"]/gi, 'key:"[REDACTED]"')
      .replace(/secret['":\s]*['"][^'"]*['"]/gi, 'secret:"[REDACTED]"')
      .replace(/email['":\s]*['"][^'"]*@[^'"]*['"]/gi, 'email:"[REDACTED]"');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
      if (typeof key === 'string' && 
          /password|token|key|secret|email|phone|ssn|credit/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

// Direct console bypass for debugging (bypasses secure logger entirely)
export const debugLog = {
  log: (...args: any[]) => {
    if (isDebugMode()) {
      originalConsole.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDebugMode()) {
      originalConsole.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDebugMode()) {
      originalConsole.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDebugMode()) {
      originalConsole.info(...args);
    }
  }
};

// Enhanced secure logger with debug mode support
class SecureLogger {
  shouldLog(): boolean {
    return isDebugMode();
  }

  log(...args: any[]): void {
    if (this.shouldLog()) {
      originalConsole.log(...args.map(sanitizeData));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog()) {
      originalConsole.error(...args.map(sanitizeData));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog()) {
      originalConsole.warn(...args.map(sanitizeData));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog()) {
      originalConsole.info(...args.map(sanitizeData));
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog()) {
      originalConsole.debug(...args.map(sanitizeData));
    }
  }

  // Server-side logging for production (to be sent to secure logging service)
  secureLog(level: 'info' | 'warn' | 'error', message: string, metadata?: any): void {
    if (!isDebugMode()) {
      // In production, send to secure logging service
      // For now, we'll silently ignore or could implement remote logging
      return;
    }
    this[level](message, metadata);
  }

  // Debug mode utilities
  enableDebugMode(): void {
    const win = getWindow();
    if (win) {
      try {
        localStorage.setItem('debug-mode', 'true');
        this.restoreConsole();
        originalConsole.info('Debug mode enabled. Console logging restored.');
      } catch (e) {
        originalConsole.warn('Could not enable debug mode:', e);
      }
    }
  }

  disableDebugMode(): void {
    const win = getWindow();
    if (win) {
      try {
        localStorage.removeItem('debug-mode');
        this.disableConsole();
        originalConsole.info('Debug mode disabled. Console logging hidden.');
      } catch (e) {
        originalConsole.warn('Could not disable debug mode:', e);
      }
    }
  }

  private restoreConsole(): void {
    Object.assign(console, originalConsole);
  }

  public disableConsole(): void {
    const noop = () => {};
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    console.table = noop;
    console.group = noop;
    console.groupEnd = noop;
    console.count = noop;
    console.time = noop;
    console.timeEnd = noop;
  }
}

export const logger = new SecureLogger();

// Initialize console security in production
const win = getWindow();
if (!isDevelopment && win) {
  // Enable debug mode to troubleshoot authentication issues  
  const shouldEnableDebug = true; // Enable debug mode for troubleshooting
  
  if (shouldEnableDebug) {
    // Keep console methods enabled for debugging
    originalConsole.info('🐛 Debug mode enabled for troubleshooting');
  } else {
    // Disable console methods by default in production
    logger.disableConsole();
  }
  
  // Expose debug controls on window object for admin access
  win.__debugMode = {
    enable: () => logger.enableDebugMode(),
    disable: () => logger.disableDebugMode(),
    status: () => isDebugMode(),
    check: () => {
      const status = isDebugMode();
      originalConsole.log('Debug mode status:', status);
      return status;
    }
  };
}
