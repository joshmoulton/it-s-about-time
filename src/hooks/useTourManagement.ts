
import { useState, useEffect } from 'react';
import { useTourPreferences } from './useTourPreferences';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

export type TourType = 'dashboard' | 'content' | 'account';

export function useTourManagement() {
  const { currentUser } = useEnhancedAuth();
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourType, setTourType] = useState<TourType>('dashboard');
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const { isTourDisabled, shouldShowTour, disableTour, enableTour } = useTourPreferences(currentUser?.email);

  // Add defensive logging for user context
  useEffect(() => {
    console.log('🎮 Tour management: User context changed - Email:', currentUser?.email, 'Tour disabled:', isTourDisabled);
  }, [currentUser?.email, isTourDisabled]);

  const startTour = (type: TourType = 'dashboard') => {
    console.log('🚀 Starting tour:', type);
    setTourType(type);
    setShowExitConfirmation(false);
    setIsTourActive(true);
  };

  const handleTourComplete = () => {
    console.log('✅ Tour completed - disabling tour');
    setIsTourActive(false);
    setShowExitConfirmation(false);
    disableTour();
  };

  const handleTourSkip = () => {
    console.log('⏭️ Tour skipped - showing exit confirmation');
    setIsTourActive(false);
    setShowExitConfirmation(true);
  };

  const handleTourClose = () => {
    console.log('❌ Tour closed - showing exit confirmation');
    setIsTourActive(false);
    setShowExitConfirmation(true);
  };

  const handleNeverShowAgain = () => {
    console.log('🚫 Never show again selected');
    setShowExitConfirmation(false);
    disableTour();
  };

  const handleShowLater = () => {
    console.log('⏰ Show later selected');
    setShowExitConfirmation(false);
    // Don't disable tour - just close the dialog
  };

  const handleCloseConfirmation = () => {
    console.log('⬅️ Closing confirmation dialog');
    setShowExitConfirmation(false);
  };

  const shouldShowOnboarding = () => {
    // Don't show tour if we don't have user context yet (during loading)
    if (currentUser === undefined) {
      console.log('🎯 User still loading, deferring tour decision');
      return false;
    }
    
    const result = shouldShowTour();
    console.log('🤔 Should show onboarding for user:', currentUser?.email || 'anonymous', '- Result:', result, 'tour disabled:', isTourDisabled);
    return result;
  };

  const forceRestartTour = (type: TourType = 'dashboard') => {
    console.log('🔄 Force restarting tour:', type);
    enableTour();
    setShowExitConfirmation(false);
    setIsTourActive(false);
    
    setTimeout(() => {
      setTourType(type);
      setIsTourActive(true);
    }, 100);
  };

  return {
    isTourActive,
    tourType,
    showExitConfirmation,
    isTourDisabled,
    startTour,
    handleTourComplete,
    handleTourSkip,
    handleTourClose,
    handleNeverShowAgain,
    handleShowLater,
    handleCloseConfirmation,
    shouldShowOnboarding,
    forceRestartTour,
  };
}
