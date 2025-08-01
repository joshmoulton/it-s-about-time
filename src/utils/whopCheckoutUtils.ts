
import { toast } from 'sonner';

export const openWhopCheckout = (productId: string, options?: {
  utm_source?: string;
  utm_medium?: string;
  onSuccess?: () => void;
}) => {
  if (!productId) {
    toast.error('Invalid product ID');
    return;
  }

  const baseUrl = `https://whop.com/checkout/${productId}`;
  const searchParams = new URLSearchParams();
  
  if (options?.utm_source) {
    searchParams.set('utm_source', options.utm_source);
  }
  
  if (options?.utm_medium) {
    searchParams.set('utm_medium', options.utm_medium);
  }
  
  const checkoutUrl = searchParams.toString() 
    ? `${baseUrl}?${searchParams.toString()}`
    : baseUrl;

  // Open in new tab
  const newWindow = window.open(checkoutUrl, '_blank');
  
  if (!newWindow) {
    toast.error('Popup blocked. Please allow popups and try again.');
    return;
  }

  toast.info('Checkout opened in new tab');
  
  // Call success callback if provided
  if (options?.onSuccess) {
    // Give some time for the window to load before calling success
    setTimeout(() => {
      options.onSuccess?.();
    }, 1000);
  }
};

export const getWhopEmbeddedCheckoutUrl = (productId: string, options?: {
  utm_source?: string;
  utm_medium?: string;
}) => {
  if (!productId) {
    return null;
  }

  const baseUrl = `https://whop.com/checkout/${productId}`;
  const searchParams = new URLSearchParams();
  
  // Add embed parameters for better experience
  searchParams.set('embed', 'true');
  searchParams.set('minimal', 'true');
  searchParams.set('hide_address', 'true');
  searchParams.set('fast_checkout', 'true');
  
  if (options?.utm_source) {
    searchParams.set('utm_source', options.utm_source);
  }
  
  if (options?.utm_medium) {
    searchParams.set('utm_medium', options.utm_medium);
  }
  
  return `${baseUrl}?${searchParams.toString()}`;
};
