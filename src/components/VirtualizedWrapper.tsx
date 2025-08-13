import React, { memo, useRef, useEffect, useState } from 'react';

interface VirtualizedWrapperProps {
  children: React.ReactNode;
  height?: number;
  threshold?: number;
}

const VirtualizedWrapper = memo(({ children, height = 500, threshold = 0.1 }: VirtualizedWrapperProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div 
      ref={ref} 
      style={{ 
        minHeight: isVisible ? 'auto' : height,
        contentVisibility: 'auto',
        containIntrinsicSize: `0 ${height}px`
      }}
    >
      {isVisible ? children : (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

VirtualizedWrapper.displayName = 'VirtualizedWrapper';

export default VirtualizedWrapper;