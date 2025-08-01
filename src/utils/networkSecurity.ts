// Network security utilities for sanitizing requests and responses
import { logger } from './secureLogger';

// Sanitize network request data
export const sanitizeRequest = (url: string, data?: any) => {
  if (!data) return data;
  
  const sanitizedData = { ...data };
  
  // Remove sensitive fields from requests
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'api_key', 'auth'];
  sensitiveFields.forEach(field => {
    if (sanitizedData[field]) {
      sanitizedData[field] = '[REDACTED]';
    }
  });
  
  return sanitizedData;
};

// Sanitize network response data
export const sanitizeResponse = (response: any) => {
  if (!response) return response;
  
  const sanitized = { ...response };
  
  // Remove sensitive fields from responses
  const sensitiveFields = ['password', 'token', 'session_token', 'refresh_token', 'access_token'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Secure network logging
export const logNetworkRequest = (method: string, url: string, data?: any) => {
  logger.debug(`🌐 ${method.toUpperCase()} ${url}`, sanitizeRequest(url, data));
};

export const logNetworkResponse = (status: number, url: string, data?: any) => {
  logger.debug(`📥 ${status} ${url}`, sanitizeResponse(data));
};

export const logNetworkError = (error: any, url: string) => {
  logger.error(`❌ Network Error ${url}:`, {
    message: error.message,
    status: error.status || 'unknown'
  });
};