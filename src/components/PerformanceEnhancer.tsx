interface PerformanceEnhancerProps {
  children: React.ReactNode;
}

export const PerformanceEnhancer = ({ children }: PerformanceEnhancerProps) => {
  // No performance optimizations - just render children
  return <>{children}</>;
};