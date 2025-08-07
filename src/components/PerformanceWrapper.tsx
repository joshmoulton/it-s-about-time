import React, { memo } from 'react';

interface PerformanceWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const PerformanceWrapper = memo(({ children, className }: PerformanceWrapperProps) => {
  return (
    <div className={className} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
      {children}
    </div>
  );
});

PerformanceWrapper.displayName = 'PerformanceWrapper';

export default PerformanceWrapper;