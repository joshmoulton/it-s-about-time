// Enhanced security validation utilities
import { sanitizeHtml } from './htmlSanitizer';

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Additional security checks
  if (email.length > 254) return false; // RFC 5321 limit
  if (email.includes('..')) return false; // Consecutive dots
  
  return true;
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Use HTML sanitizer for comprehensive cleaning
  const htmlCleaned = sanitizeHtml(input, 'notification');
  
  return htmlCleaned
    .trim()
    .substring(0, 1000); // Limit length
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const isSecureOrigin = (origin: string): boolean => {
  const allowedOrigins = [
    'https://lovable.dev',
    'https://preview.lovable.dev',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  return allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.dev')
  );
};

export const rateLimitCheck = (key: string, limit: number = 10, windowMs: number = 60000): boolean => {
  // Simple in-memory rate limiting for client-side
  const now = Date.now();
  const windowKey = `${key}_${Math.floor(now / windowMs)}`;
  
  let count = parseInt(localStorage.getItem(windowKey) || '0');
  
  if (count >= limit) {
    return false;
  }
  
  localStorage.setItem(windowKey, (count + 1).toString());
  
  // Clean up old entries
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (storageKey && storageKey.startsWith(key) && storageKey !== windowKey) {
      localStorage.removeItem(storageKey);
    }
  }
  
  return true;
};