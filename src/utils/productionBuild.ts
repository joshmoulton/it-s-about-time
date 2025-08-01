
// Production build optimizations for removing debug code and console logs
import { isDevelopment } from './secureLogger';

// Build-time code elimination utility
export const stripDebugCode = (code: string): string => {
  if (isDevelopment) return code;
  
  // Remove console statements in production builds
  return code
    .replace(/console\.(log|debug|info|warn|error|trace|table|group|groupEnd|count|time|timeEnd)\([^)]*\);?/g, '')
    .replace(/\/\*\s*DEBUG.*?\*\//g, '')
    .replace(/\/\/\s*DEBUG.*/g, '')
    .replace(/debugger;?/g, '');
};

// Vite plugin for stripping debug code in production
export const stripDebugPlugin = () => {
  return {
    name: 'strip-debug',
    transform(code: string, id: string) {
      if (process.env.NODE_ENV === 'production' && 
          (id.endsWith('.ts') || id.endsWith('.tsx') || id.endsWith('.js') || id.endsWith('.jsx'))) {
        return {
          code: stripDebugCode(code),
          map: null
        };
      }
      return null;
    }
  };
};

// Production environment detection
export const isProduction = process.env.NODE_ENV === 'production';

// Integration-friendly security headers for production
export const securityHeaders = {
  // Allow framing from Lovable and same origin - removed X-Frame-Options to prevent preview issues
  // X-Frame-Options is handled via CSP frame-ancestors instead
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Restrict dangerous browser features while allowing necessary ones
  'Permissions-Policy': [
    'camera=()',
    'microphone=()', 
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    // Allow fullscreen for YouTube embeds and video content
    'fullscreen=(self)',
    // Allow picture-in-picture for video content
    'picture-in-picture=(self)',
    // Allow web-share for sharing functionality
    'web-share=(self)'
  ].join(', '),
  
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Ensure HTTPS in production
  ...(isProduction && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
};

// Frame-busting protection for sensitive admin pages
export const adminFrameBusting = `
  <script>
    if (window.top !== window.self) {
      try {
        if (window.top.location.hostname !== window.location.hostname) {
          window.top.location = window.self.location;
        }
      } catch (e) {
        window.top.location = window.self.location;
      }
    }
  </script>
`;

// CSP violation reporting endpoint (for future monitoring)
export const cspReportUri = isProduction 
  ? 'https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/csp-report'
  : null;
