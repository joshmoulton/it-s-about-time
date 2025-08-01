import { toast } from 'sonner';

// Enhanced error handling utilities
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  retryable?: boolean;
}

// Error types for better error handling
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTH = 'AUTH_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER = 'SERVER_ERROR',
  CLIENT = 'CLIENT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// Create typed error
export function createAppError(
  message: string,
  type: ErrorType,
  statusCode?: number,
  context?: Record<string, any>,
  retryable: boolean = false
): AppError {
  const error = new Error(message) as AppError;
  error.code = type;
  error.statusCode = statusCode;
  error.context = context;
  error.retryable = retryable;
  return error;
}

// Error classification
export function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return ErrorType.AUTH;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorType.PERMISSION;
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return ErrorType.RATE_LIMIT;
    }
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    
    if (errorObj.status >= 500) {
      return ErrorType.SERVER;
    }
    if (errorObj.status >= 400) {
      return ErrorType.CLIENT;
    }
  }
  
  return ErrorType.UNKNOWN;
}

// User-friendly error messages
export function getUserFriendlyMessage(error: unknown): string {
  const errorType = classifyError(error);
  
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Connection issue detected. Please check your internet connection and try again.';
    case ErrorType.AUTH:
      return 'Authentication required. Please log in again.';
    case ErrorType.VALIDATION:
      return 'Invalid input provided. Please check your data and try again.';
    case ErrorType.PERMISSION:
      return 'You don\'t have permission to perform this action.';
    case ErrorType.RATE_LIMIT:
      return 'Too many requests. Please wait a moment before trying again.';
    case ErrorType.SERVER:
      return 'Server error occurred. Our team has been notified.';
    case ErrorType.CLIENT:
      return 'Request error. Please check your input and try again.';
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
}

// Enhanced error handler with retries and user feedback
export class ErrorHandler {
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000;

  async handleError(
    error: unknown,
    context: string,
    showToast: boolean = true,
    allowRetry: boolean = true
  ): Promise<void> {
    const errorType = classifyError(error);
    const message = getUserFriendlyMessage(error);
    
    // Log error for debugging
    console.error(`[${context}] Error:`, error);
    
    // Show user feedback
    if (showToast) {
      const shouldRetry = allowRetry && this.isRetryable(error, context);
      
      if (shouldRetry) {
        toast.error(message, {
          description: 'Click to retry',
          action: {
            label: 'Retry',
            onClick: () => this.retry(context, error)
          }
        });
      } else {
        toast.error(message);
      }
    }
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, context);
    }
  }

  private isRetryable(error: unknown, context: string): boolean {
    const errorType = classifyError(error);
    const retryCount = this.retryAttempts.get(context) || 0;
    
    // Don't retry if max attempts reached
    if (retryCount >= this.maxRetries) {
      return false;
    }
    
    // Only retry certain error types
    return [
      ErrorType.NETWORK,
      ErrorType.RATE_LIMIT,
      ErrorType.SERVER
    ].includes(errorType);
  }

  private async retry(context: string, originalError: unknown): Promise<void> {
    const currentAttempts = this.retryAttempts.get(context) || 0;
    this.retryAttempts.set(context, currentAttempts + 1);
    
    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, currentAttempts);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Emit retry event for components to handle
    window.dispatchEvent(new CustomEvent('error-retry', {
      detail: { context, attempt: currentAttempts + 1 }
    }));
  }

  public reportError(error: unknown, context: string): void {
    // In a real app, send to error reporting service like Sentry
    console.warn('Error reporting not configured:', { error, context });
  }

  clearRetryAttempts(context?: string): void {
    if (context) {
      this.retryAttempts.delete(context);
    } else {
      this.retryAttempts.clear();
    }
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Hook for handling async errors in components
export function useErrorHandler() {
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    clearRetries: errorHandler.clearRetryAttempts.bind(errorHandler)
  };
}

// Error boundary utilities
export function logErrorToService(error: Error, errorInfo: any): void {
  console.error('Error boundary caught an error:', error, errorInfo);
  
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service
    errorHandler.reportError(error, 'error-boundary');
  }
}

// Network error handler
export function handleNetworkError(error: unknown): void {
  if (navigator.onLine === false) {
    toast.error('You appear to be offline. Please check your connection.');
    return;
  }
  
  errorHandler.handleError(error, 'network', true, true);
}