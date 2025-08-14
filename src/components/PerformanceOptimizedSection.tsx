import React, { ReactNode, useRef, useEffect, useState } from 'react';

interface PerformanceOptimizedSectionProps {
  children: ReactNode;
  className?: string;
  estimatedHeight?: number;
  id?: string;
  useContentVisibility?: boolean;
}

export const PerformanceOptimizedSection: React.FC<PerformanceOptimizedSectionProps> = ({
  children,
  className = '',
  estimatedHeight = 400,
  id,
  useContentVisibility = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!useContentVisibility) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [useContentVisibility]);

  return (
    <div 
      ref={ref}
      id={id}
      className={className}
      style={{
        contentVisibility: useContentVisibility ? 'auto' : 'visible',
        containIntrinsicSize: useContentVisibility ? `0 ${estimatedHeight}px` : undefined,
      }}
    >
      {isVisible ? children : (
        <div 
          className="flex items-center justify-center bg-muted/10"
          style={{ height: estimatedHeight }}
        >
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};