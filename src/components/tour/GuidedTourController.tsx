
import React from 'react';
import { GuidedTour } from './GuidedTour';
import { SimpleTourExitDialog } from './SimpleTourExitDialog';
import { getDashboardTourSteps, getContentTourSteps } from './tourSteps';
import { useTourManagement, TourType } from '@/hooks/useTourManagement';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface GuidedTourControllerProps {
  subscriber: Subscriber | null;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function GuidedTourController({ 
  subscriber, 
  activeSection, 
  setActiveSection 
}: GuidedTourControllerProps) {
  console.log('🎮 GuidedTourController: Initializing with subscriber:', subscriber?.email);
  
  const {
    isTourActive,
    tourType,
    showExitConfirmation,
    startTour,
    handleTourComplete,
    handleTourSkip,
    handleTourClose,
    handleNeverShowAgain,
    handleShowLater,
    handleCloseConfirmation,
    shouldShowOnboarding,
    forceRestartTour,
  } = useTourManagement();

  const getCurrentTourSteps = () => {
    let steps;
    switch (tourType) {
      case 'dashboard':
        steps = getDashboardTourSteps(subscriber);
        break;
      case 'content':
        steps = getContentTourSteps(setActiveSection);
        break;
      default:
        steps = getDashboardTourSteps(subscriber);
    }
    
    return steps;
  };

  const handleStartTour = (type: TourType = 'dashboard') => {
    // Navigate to dashboard for dashboard tour
    if (type === 'dashboard' && activeSection !== 'dashboard') {
      setActiveSection('dashboard');
    }
    
    startTour(type);
  };

  const tourComponent = (
    <>
      <GuidedTour
        steps={getCurrentTourSteps()}
        isActive={isTourActive && !showExitConfirmation}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        onClose={handleTourClose}
      />
      
      <SimpleTourExitDialog
        isOpen={showExitConfirmation}
        onNeverShowAgain={handleNeverShowAgain}
        onShowLater={handleShowLater}
      />
    </>
  );

  return {
    startTour: handleStartTour,
    forceRestartTour,
    shouldShowOnboarding,
    tourComponent,
  };
}
