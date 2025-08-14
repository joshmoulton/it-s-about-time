import React, { useState, useRef, useEffect } from 'react';

interface OptimizedResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  webpSrc?: string;
  avifSrc?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export const OptimizedResponsiveImage: React.FC<OptimizedResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  webpSrc,
  avifSrc,
  loading = 'lazy',
  fetchPriority = 'auto',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || loading === 'eager') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  const shouldLoad = priority || loading === 'eager' || isInView;

  return (
    <picture className={className}>
      {/* AVIF format for modern browsers - only load if in view */}
      {avifSrc && shouldLoad && (
        <source 
          srcSet={avifSrc} 
          type="image/avif" 
          sizes={sizes}
        />
      )}
      
      {/* WebP format for most browsers - only load if in view */}
      {webpSrc && shouldLoad && (
        <source 
          srcSet={webpSrc} 
          type="image/webp" 
          sizes={sizes}
        />
      )}
      
      {/* Fallback image with optimized attributes */}
      <img
        ref={imgRef}
        src={shouldLoad ? src : undefined}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        width={width}
        height={height}
        sizes={sizes}
        style={{
          aspectRatio: `${width}/${height}`,
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      
      {/* Placeholder to prevent CLS */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-muted/20 animate-pulse"
          style={{
            aspectRatio: `${width}/${height}`,
            width: '100%',
            height: 'auto',
          }}
        />
      )}
    </picture>
  );
};