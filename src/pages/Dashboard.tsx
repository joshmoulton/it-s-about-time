
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
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import VirtualizedWrapper from '@/components/VirtualizedWrapper';

// Lazy load the heavy dashboard content
const DashboardContent = lazy(() => 
  import('@/components/dashboard/DashboardContent').then(module => ({
    default: module.DashboardContent
  }))
);

const Dashboard = () => {
  // Feature flag to disable tour functionality
  const TOUR_ENABLED = false;
  
  useRenderTracker('Dashboard');
  
  // Enable mobile performance optimizations
  useMobilePerformance();
  
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
  // For magic link users, check localStorage for tier information and ensure premium users get proper access
  const subscriberForComponents = memoizedCurrentUser ? {
    id: memoizedCurrentUser.id,
    email: memoizedCurrentUser.email,
    status: memoizedCurrentUser.status || 'active',
    subscription_tier: (() => {
      // For enhanced auth (magic link) users, prioritize the currentUser tier
      if (memoizedCurrentUser.subscription_tier) {
        // Normalize tier to match expected format
        const tier = memoizedCurrentUser.subscription_tier;
        if (tier === 'premium' || tier === 'paid') {
          return 'premium';
        }
        return tier as 'free' | 'paid' | 'premium';
      }
      
      // For magic link users, check localStorage as fallback
      const authMethod = localStorage.getItem('auth_method');
      const authTier = localStorage.getItem('auth_tier');
      const authEmail = localStorage.getItem('auth_user_email');
      
      if (authMethod === 'magic_link' && authEmail === memoizedCurrentUser.email && authTier) {
        // Normalize tier from localStorage
        if (authTier === 'premium' || authTier === 'paid') {
          return 'premium';
        }
        return authTier as 'free' | 'paid' | 'premium';
      }
      
      return 'free';
    })(),
    created_at: memoizedCurrentUser.created_at || new Date().toISOString(),
    updated_at: memoizedCurrentUser.updated_at || new Date().toISOString(),
    metadata: memoizedCurrentUser.metadata || {}
  } : null;

  // Debug logging for magic link authentication issues
  console.log('🔍 Dashboard Auth Debug:', {
    currentUser: !!memoizedCurrentUser,
    email: memoizedCurrentUser?.email,
    tier: memoizedCurrentUser?.subscription_tier,
    subscriber: !!subscriberForComponents,
    subscriberTier: subscriberForComponents?.subscription_tier,
    authMethod: localStorage.getItem('auth_method'),
    authTier: localStorage.getItem('auth_tier'),
    authEmail: localStorage.getItem('auth_user_email')
  });

  // Simplified tour initialization without delays for admin users
  const tourController = TOUR_ENABLED ? GuidedTourController({
    subscriber: subscriberForComponents,
    activeSection,
    setActiveSection,
  }) : null;

  // Tour initialization - auto-start for all users unless they chose never show again
  useEffect(() => {
    if (!TOUR_ENABLED || !tourController) return;
    
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
  }, [isLoading, memoizedCurrentUser?.user_type, TOUR_ENABLED, tourController]);

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
          onStartTour={TOUR_ENABLED && tourController ? () => tourController.startTour('dashboard') : undefined}
        />
      </div>
      
      {/* Content Layer - z-index: 10 */}
      <div className="relative" style={{ zIndex: 10 }}>
        <VirtualizedWrapper height={600}>
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
              onStartTour={TOUR_ENABLED && tourController ? tourController.startTour : undefined}
              onForceRestartTour={TOUR_ENABLED && tourController ? tourController.forceRestartTour : undefined}
            />
          </LazyLoadWrapper>
        </VirtualizedWrapper>
      </div>
      
      {/* Tour component - z-index: 40 */}
      {TOUR_ENABLED && tourController && (
        <div style={{ zIndex: 40 }}>
          {tourController.tourComponent}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
