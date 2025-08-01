
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface SecurityConfig {
  isAdminRoute: boolean;
  requiresFrameBusting: boolean;
  cspViolationCount: number;
}

export const useSecurity = () => {
  const location = useLocation();
  const [config, setConfig] = useState<SecurityConfig>({
    isAdminRoute: false,
    requiresFrameBusting: false,
    cspViolationCount: 0
  });

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const requiresFrameBusting = isAdminRoute || location.pathname.includes('/profile');
    
    setConfig(prev => ({
      ...prev,
      isAdminRoute,
      requiresFrameBusting
    }));

    // Add frame-busting protection for sensitive routes
    if (requiresFrameBusting && typeof window !== 'undefined') {
      const frameBustingScript = () => {
        if (window.top !== window.self) {
          try {
            if (window.top.location.hostname !== window.location.hostname) {
              window.top.location.href = window.self.location.href;
            }
          } catch (e) {
            window.top.location.href = window.self.location.href;
          }
        }
      };

      // Execute immediately
      frameBustingScript();
      
      // Also check periodically for admin routes
      const interval = isAdminRoute ? setInterval(frameBustingScript, 1000) : null;
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [location.pathname]);

  // Monitor CSP violations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleSecurityPolicyViolation = (event: SecurityPolicyViolationEvent) => {
        console.warn('🚨 CSP Violation:', {
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          documentURI: event.documentURI,
          originalPolicy: event.originalPolicy
        });
        
        setConfig(prev => ({
          ...prev,
          cspViolationCount: prev.cspViolationCount + 1
        }));
      };

      document.addEventListener('securitypolicyviolation', handleSecurityPolicyViolation);
      
      return () => {
        document.removeEventListener('securitypolicyviolation', handleSecurityPolicyViolation);
      };
    }
  }, []);

  return {
    ...config,
    // Helper to check if current environment is secure
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
    // Helper to check if headers are properly set (for debugging)
    checkSecurityHeaders: async () => {
      if (typeof window === 'undefined') return null;
      
      try {
        const response = await fetch('/api/security-check');
        return await response.json();
      } catch (error) {
        console.error('Security check failed:', error);
        return null;
      }
    }
  };
};
