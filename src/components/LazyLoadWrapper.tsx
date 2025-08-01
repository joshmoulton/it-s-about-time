import React, { Suspense, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  height?: string;
  className?: string;
}

// Enhanced lazy loading wrapper with better UX
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback,
  height = "200px",
  className = ""
}) => {
  const defaultFallback = (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ minHeight: height }}
    >
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// HOC for creating lazy loaded components with optimized loading
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  FallbackComponent?: ComponentType
) {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoadWrapper
      fallback={FallbackComponent ? <FallbackComponent /> : undefined}
    >
      <LazyComponent {...props} ref={ref} />
    </LazyLoadWrapper>
  ));
}

// Hook for lazy loading data with intersection observer
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  threshold: number = 0.1
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !data && !loading) {
          setLoading(true);
          setError(null);
          
          try {
            const result = await loadFn();
            setData(result);
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold }
    );

    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [loadFn, threshold, data, loading]);

  return {
    ref: elementRef,
    data,
    loading,
    error,
    retry: () => {
      setError(null);
      setData(null);
    }
  };
}

// Component for lazy loading images with placeholder
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  placeholderHeight?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder,
  placeholderHeight = "200px",
  className = "",
  ...props
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);
    
    return () => {
      observer.unobserve(img);
    };
  }, [src]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted ${className}`}
        style={{ height: placeholderHeight }}
      >
        <p className="text-muted-foreground text-sm">Failed to load image</p>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div 
          className={`flex items-center justify-center bg-muted animate-pulse ${className}`}
          style={{ height: placeholderHeight }}
        >
          {placeholder ? (
            <img src={placeholder} alt="Loading..." className="opacity-50" />
          ) : (
            <div className="w-12 h-12 bg-muted-foreground/20 rounded-full" />
          )}
        </div>
      )}
      <img
        ref={imgRef}
        className={`${className} ${loaded ? 'block' : 'hidden'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...props}
        alt={props.alt || ''}
      />
    </>
  );
};