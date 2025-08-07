// Image optimization utilities
export const getOptimizedImageProps = (src: string, alt: string, loading: 'lazy' | 'eager' = 'lazy') => {
  return {
    src,
    alt,
    loading,
    decoding: 'async' as const,
    style: { contentVisibility: 'auto' as const }
  };
};

export const preloadImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

export const lazyLoadImage = (imgElement: HTMLImageElement, src: string) => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          imgElement.src = src;
          observer.unobserve(imgElement);
        }
      });
    });
    observer.observe(imgElement);
  } else {
    // Fallback for older browsers
    imgElement.src = src;
  }
};