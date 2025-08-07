import DOMPurify from 'dompurify';

// Safe HTML sanitization configuration for different contexts
const createSanitizeConfig = (context: 'email' | 'newsletter' | 'notification' = 'email') => {
  const baseConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'pre', 'code'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'class', 'style', 'target', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    KEEP_CONTENT: true
  };

  // Context-specific configurations
  switch (context) {
    case 'newsletter':
      return {
        ...baseConfig,
        // Allow more styling for newsletter content
        ALLOWED_ATTR: [...baseConfig.ALLOWED_ATTR, 'data-*'],
        ALLOWED_TAGS: [...baseConfig.ALLOWED_TAGS, 'figure', 'figcaption', 'video', 'audio']
      };
    case 'notification':
      return {
        ...baseConfig,
        // More restrictive for notifications
        ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'span', 'a'],
        ALLOWED_ATTR: ['href', 'class', 'target', 'rel']
      };
    case 'email':
    default:
      return baseConfig;
  }
};

/**
 * Safely sanitize HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @param context - The context where the HTML will be used (affects sanitization rules)
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (
  html: string, 
  context: 'email' | 'newsletter' | 'notification' = 'email'
): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const config = createSanitizeConfig(context);
    const sanitized = DOMPurify.sanitize(html, config);
    
    // Additional security check - ensure no dangerous patterns remain
    const dangerousPatterns = [
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /<script[^>]*>/gi,
      /on\w+\s*=/gi
    ];
    
    let cleanHtml = String(sanitized);
    dangerousPatterns.forEach(pattern => {
      cleanHtml = cleanHtml.replace(pattern, '');
    });
    
    return cleanHtml;
  } catch (error) {
    console.error('HTML sanitization error:', error);
    // Return empty string on error for security
    return '';
  }
};

/**
 * Create a safe innerHTML prop object for React components
 * @param html - The HTML content to sanitize
 * @param context - The context where the HTML will be used
 * @returns Object with __html property containing sanitized HTML
 */
export const createSafeInnerHTML = (
  html: string, 
  context: 'email' | 'newsletter' | 'notification' = 'email'
) => {
  return { __html: sanitizeHtml(html, context) };
};

/**
 * Validate that HTML content is safe for rendering
 * @param html - The HTML content to validate
 * @returns boolean indicating if the content is safe
 */
export const isHtmlSafe = (html: string): boolean => {
  if (!html || typeof html !== 'string') {
    return true; // Empty content is safe
  }
  
  // Check for obviously dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(html));
};