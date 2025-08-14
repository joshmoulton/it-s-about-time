import { useEffect } from 'react';
import { initializeSafeOptimizations } from '@/utils/safeOptimizations';

interface PerformanceEnhancerProps {
  children: React.ReactNode;
}

export const PerformanceEnhancer = ({ children }: PerformanceEnhancerProps) => {
  useEffect(() => {
    // Apply only safe optimizations that don't break functionality
    initializeSafeOptimizations();
  }, []);

  // Render children immediately - no blocking or loading states
  return <>{children}</>;
};