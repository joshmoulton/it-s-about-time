
import React, { useState, useEffect, Suspense, lazy, useMemo, useLayoutEffect } from 'react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useSearchParams } from 'react-router-dom';
import { TopNavigation } from '@/components/dashboard/TopNavigation';
import { DashboardLoader } from '@/components/dashboard/DashboardLoader';
import { GuidedTourController } from '@/components/tour/GuidedTourController';
import { Loader2 } from 'lucide-react';
import { LazyLoadWrapper } from '@/components/LazyLoadWrapper';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useRenderTracker } from '@/components/PerformanceOptimizer';
import { SEOManager } from '@/components/SEOManager';
import { DegenCommandTester } from '@/components/DegenCommandTester';

// Lazy load the heavy dashboard content
const DashboardContent = lazy(() => 
  import('@/components/dashboard/DashboardContent').then(module => ({
    default: module.DashboardContent
  }))
);

const Dashboard = () => {
  useRenderTracker('Dashboard');
  
  const { currentUser, isLoading } = useEnhancedAuth();
  const [searchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  const connectionStatus = useConnectionStatus();
  
  // Check if we're on the /dashboard/content route
  const isContentRoute = window.location.pathname === '/dashboard/content';
  const initialSection = isContentRoute ? 'content' : (sectionFromUrl || 'overview');
  
  const [activeSection, setActiveSection] = useState(initialSection);

  // Force scroll to top immediately when dashboard loads
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Update active section when URL changes
  useEffect(() => {
    const newSection = isContentRoute ? 'content' : (sectionFromUrl || 'overview');
    setActiveSection(newSection);
  }, [sectionFromUrl, isContentRoute]);

  // Memoize currentUser to prevent unnecessary re-renders
  const memoizedCurrentUser = useMemo(() => currentUser, [currentUser?.id, currentUser?.email, currentUser?.metadata]);
  
  // Convert currentUser to subscriber format for components that expect it
  const subscriberForComponents = memoizedCurrentUser ? {
    id: memoizedCurrentUser.id,
    email: memoizedCurrentUser.email,
    status: memoizedCurrentUser.status || 'active',
    subscription_tier: (memoizedCurrentUser.subscription_tier as 'free' | 'paid' | 'premium') || 'free',
    created_at: memoizedCurrentUser.created_at || new Date().toISOString(),
    updated_at: memoizedCurrentUser.updated_at || new Date().toISOString(),
    metadata: memoizedCurrentUser.metadata || {}
  } : null;

  // Simplified tour initialization without delays for admin users
  const tourController = GuidedTourController({
    subscriber: subscriberForComponents,
    activeSection,
    setActiveSection,
  });

  // Tour initialization - auto-start for all users unless they chose never show again
  useEffect(() => {
    if (!isLoading && memoizedCurrentUser && memoizedCurrentUser.user_type !== 'supabase_admin') {
      const shouldShowTour = tourController.shouldShowOnboarding();
      
      if (shouldShowTour) {
        // Auto-start tour for all users who haven't opted out
        const timer = setTimeout(() => {
          tourController.startTour('dashboard');
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, memoizedCurrentUser?.user_type]);

  if (isLoading) {
    return <DashboardLoader />;
  }

  if (!memoizedCurrentUser) {
    return <DashboardLoader />;
  }

  console.log('🎨 Dashboard CSS Debug:', {
    brandNavy: getComputedStyle(document.documentElement).getPropertyValue('--brand-navy'),
    background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
    isDarkMode: document.documentElement.classList.contains('dark')
  });
  
  return (
    <div className="min-h-screen flex flex-col w-full relative" style={{ backgroundColor: 'hsl(0 0% 3%)' }}>
      {/* Pattern Layer - z-index: 1 */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='0' cy='0' r='50' fill='none' stroke='%23081426' stroke-width='2'/%3E%3Ccircle cx='100' cy='0' r='50' fill='none' stroke='%23081426' stroke-width='2'/%3E%3Ccircle cx='0' cy='100' r='50' fill='none' stroke='%23081426' stroke-width='2'/%3E%3Ccircle cx='100' cy='100' r='50' fill='none' stroke='%23081426' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%23081426' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: 'clamp(80px, 7vw, 140px)',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0',
          zIndex: 1,
          pointerEvents: 'none'
        }}
        onLoad={() => console.log('🎨 Pattern div loaded')}
      />
      
      {/* SEO Manager for dashboard-specific title */}
      <SEOManager 
        title="Weekly Wizdom - Dashboard"
        description="Access your personalized trading dashboard with real-time market analysis, performance tracking, and premium investment insights."
        image="/lovable-uploads/41a57ccc-0a24-4abd-89b1-3c41c3cc3d08.png"
      />
      
      {/* Navigation Layer - z-index: 30 */}
      <div className="relative" style={{ zIndex: 30 }}>
        <TopNavigation 
          subscriber={subscriberForComponents!} 
          onStartTour={() => tourController.startTour('dashboard')}
        />
      </div>
      
      {/* Debug: Degen Command Tester */}
      <div className="fixed top-20 right-4 z-50">
        <DegenCommandTester />
      </div>
      
      {/* Content Layer - z-index: 10 */}
      <div className="relative" style={{ zIndex: 10 }}>
        <LazyLoadWrapper
          fallback={
            <div className="flex-1 p-3 sm:p-6 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {connectionStatus.isOffline ? 'Offline mode' : 'Loading content...'}
                </p>
                {connectionStatus.isSlowConnection && (
                  <p className="text-xs text-muted-foreground">
                    Slow connection detected, optimizing experience...
                  </p>
                )}
              </div>
            </div>
          }
          height="500px"
        >
          <DashboardContent 
            subscriber={subscriberForComponents!} 
            activeSection={activeSection}
            onStartTour={tourController.startTour}
            onForceRestartTour={tourController.forceRestartTour}
          />
        </LazyLoadWrapper>
      </div>
      
      {/* Tour component - z-index: 40 */}
      <div style={{ zIndex: 40 }}>
        {tourController.tourComponent}
      </div>
    </div>
  );
};

export default Dashboard;
