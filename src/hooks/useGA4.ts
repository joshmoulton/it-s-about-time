import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 Configuration
const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your actual GA4 ID

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics 4
export const initGA4 = (measurementId: string = GA4_MEASUREMENT_ID) => {
  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Configure GA4
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    send_page_view: true,
  });
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, {
      event_category: parameters.category || 'engagement',
      event_label: parameters.label,
      value: parameters.value,
      ...parameters,
    });
  }
};

// Enhanced event tracking functions
export const trackUserEngagement = {
  // Track user registration/signup
  signup: (method: string, userId?: string) => {
    trackEvent('sign_up', {
      method,
      user_id: userId,
      category: 'authentication',
    });
  },

  // Track user login
  login: (method: string, userId?: string) => {
    trackEvent('login', {
      method,
      user_id: userId,
      category: 'authentication',
    });
  },

  // Track subscription/upgrade events
  subscribe: (tier: string, value?: number) => {
    trackEvent('purchase', {
      currency: 'USD',
      value: value || 0,
      items: [{
        item_id: tier,
        item_name: `${tier} Subscription`,
        item_category: 'subscription',
        quantity: 1,
        price: value || 0,
      }],
      category: 'ecommerce',
    });
  },

  // Track content engagement
  contentView: (contentType: string, contentId: string, contentTitle: string) => {
    trackEvent('page_view', {
      content_type: contentType,
      content_id: contentId,
      content_title: contentTitle,
      category: 'content',
    });
  },

  // Track video engagement
  videoPlay: (videoTitle: string, videoId: string) => {
    trackEvent('video_play', {
      video_title: videoTitle,
      video_id: videoId,
      category: 'video',
    });
  },

  videoComplete: (videoTitle: string, videoId: string, duration: number) => {
    trackEvent('video_complete', {
      video_title: videoTitle,
      video_id: videoId,
      video_duration: duration,
      category: 'video',
    });
  },

  // Track social sharing
  share: (method: string, contentType: string, contentId: string) => {
    trackEvent('share', {
      method,
      content_type: contentType,
      content_id: contentId,
      category: 'social',
    });
  },

  // Track search behavior
  search: (searchTerm: string, resultsCount?: number) => {
    trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
      category: 'search',
    });
  },

  // Track file downloads
  download: (fileName: string, fileType: string) => {
    trackEvent('file_download', {
      file_name: fileName,
      file_type: fileType,
      category: 'downloads',
    });
  },

  // Track form submissions
  formSubmit: (formName: string, formId: string) => {
    trackEvent('form_submit', {
      form_name: formName,
      form_id: formId,
      category: 'forms',
    });
  },

  // Track button clicks
  buttonClick: (buttonText: string, buttonLocation: string) => {
    trackEvent('click', {
      button_text: buttonText,
      button_location: buttonLocation,
      category: 'ui_interaction',
    });
  },

  // Track scroll depth
  scrollDepth: (percentage: number, page: string) => {
    trackEvent('scroll', {
      scroll_depth: percentage,
      page_path: page,
      category: 'engagement',
    });
  },

  // Track session duration milestones
  sessionMilestone: (duration: number) => {
    trackEvent('session_milestone', {
      session_duration: duration,
      category: 'engagement',
    });
  },

  // Track errors
  error: (errorMessage: string, errorLocation: string, errorType: string = 'javascript') => {
    trackEvent('exception', {
      description: errorMessage,
      location: errorLocation,
      error_type: errorType,
      fatal: false,
      category: 'errors',
    });
  },

  // Track feature usage
  featureUse: (featureName: string, featureCategory: string) => {
    trackEvent('feature_use', {
      feature_name: featureName,
      feature_category: featureCategory,
      category: 'features',
    });
  },

  // Track navigation
  navigation: (linkText: string, destination: string, source: string) => {
    trackEvent('click', {
      link_text: linkText,
      link_destination: destination,
      link_source: source,
      category: 'navigation',
    });
  },
};

// Enhanced ecommerce tracking
export const trackEcommerce = {
  // Track product views
  viewItem: (item: any) => {
    trackEvent('view_item', {
      currency: 'USD',
      value: item.price || 0,
      items: [item],
      category: 'ecommerce',
    });
  },

  // Track add to cart/wishlist
  addToCart: (item: any) => {
    trackEvent('add_to_cart', {
      currency: 'USD',
      value: item.price || 0,
      items: [item],
      category: 'ecommerce',
    });
  },

  // Track purchase completion
  purchase: (transactionId: string, items: any[], value: number) => {
    trackEvent('purchase', {
      transaction_id: transactionId,
      currency: 'USD',
      value,
      items,
      category: 'ecommerce',
    });
  },

  // Track refunds
  refund: (transactionId: string, value: number) => {
    trackEvent('refund', {
      transaction_id: transactionId,
      currency: 'USD',
      value,
      category: 'ecommerce',
    });
  },
};

// Custom hook for automatic page view tracking
export const useGA4 = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location]);

  return {
    trackEvent,
    trackPageView,
    trackUserEngagement,
    trackEcommerce,
  };
};