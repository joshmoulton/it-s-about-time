
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TourTooltip, TourStep } from './TourTooltip';
import { TourOverlay } from './TourOverlay';
import { useTourPositioning } from '@/hooks/useTourPositioning';

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function GuidedTour({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip, 
  onClose
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  const currentStep = steps[currentStepIndex];
  const position = useTourPositioning({
    targetElement,
    preferredPlacement: currentStep?.placement || 'bottom',
    offset: 16,
  });

  const scrollToElement = useCallback(async (element: Element): Promise<void> => {
    return new Promise((resolve) => {
      setIsScrolling(true);
      
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate optimal scroll position
      const elementTop = rect.top + window.scrollY;
      const targetY = elementTop - (viewportHeight / 2) + (rect.height / 2);
      const finalScrollY = Math.max(0, targetY);
      
      console.log(`🎯 Tour: Scrolling to element, target scroll: ${finalScrollY}`);
      
      // Simple scroll with timeout completion
      window.scrollTo({
        top: finalScrollY,
        behavior: 'smooth'
      });
      
      // Reduced timeout for faster navigation
      setTimeout(() => {
        setIsScrolling(false);
        resolve();
      }, 150);
    });
  }, []);

  const findAndHighlightElement = useCallback(async (selector: string, stepIndex: number) => {
    // Verify we're still on the correct step to prevent race conditions
    if (stepIndex !== currentStepIndex) {
      console.log(`🎯 Tour: Step mismatch detected, aborting search for "${selector}"`);
      return;
    }
    
    // Reset retry counter for new step
    if (stepIndex !== currentStepIndex) {
      retryCountRef.current = 0;
    }
    
    const maxRetries = 10;
    const retryDelay = 100; // Reduced from 200ms
    
    console.log(`🔍 Tour: Looking for element "${selector}" (step ${stepIndex + 1}, attempt ${retryCountRef.current + 1})`);
    
    // Handle multiple selectors separated by commas
    const selectors = selector.split(',').map(s => s.trim());
    let element = null;
    
    // Try to find any of the selectors
    for (const sel of selectors) {
      element = document.querySelector(sel);
      if (element) {
        console.log(`✅ Tour: Found element "${sel}" for step ${stepIndex + 1}`);
        break;
      }
    }
    
    if (element) {
      // Double-check we're still on the right step before proceeding
      if (stepIndex !== currentStepIndex) {
        console.log(`🎯 Tour: Step changed during search, aborting`);
        return;
      }
      
      // Scroll to element first
      await scrollToElement(element);
      
      // Reduced wait time for scroll to settle
      setTimeout(() => {
        // Final step verification before setting target
        if (stepIndex === currentStepIndex) {
          // For multiple selectors, find all matching elements
          const allElements = selectors.map(sel => document.querySelector(sel)).filter(Boolean);
          if (allElements.length > 0) {
            // Use the first element for positioning, but store all for highlighting
            setTargetElement(allElements[0]);
            // Store additional elements for multi-element highlighting
            (allElements[0] as any)._tourMultiElements = allElements;
            retryCountRef.current = 0;
          }
        } else {
          console.log(`🎯 Tour: Step changed during scroll, not setting target`);
        }
      }, 50); // Reduced from 200ms
      
    } else if (retryCountRef.current < maxRetries) {
      console.log(`⏳ Tour: Element "${selector}" not found, retrying... (step ${stepIndex + 1})`);
      retryCountRef.current++;
      
      retryTimeoutRef.current = setTimeout(() => {
        // Only retry if we're still on the same step
        if (stepIndex === currentStepIndex) {
          findAndHighlightElement(selector, stepIndex);
        }
      }, retryDelay);
    } else {
      console.error(`❌ Tour: Element "${selector}" not found after ${maxRetries} attempts (step ${stepIndex + 1})`);
      // Skip to next step if element can't be found
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }
  }, [currentStepIndex, steps.length, onComplete, scrollToElement]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = currentStepIndex + 1;
      console.log(`🎯 Tour: Moving to step ${nextStep + 1} of ${steps.length}`);
      setCurrentStepIndex(nextStep);
      setTargetElement(null);
    } else {
      console.log(`🎯 Tour: Completing tour at final step`);
      onComplete();
    }
  }, [currentStepIndex, steps.length, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevStep = currentStepIndex - 1;
      console.log(`🎯 Tour: Moving back to step ${prevStep + 1} of ${steps.length}`);
      setCurrentStepIndex(prevStep);
      setTargetElement(null);
    }
  }, [currentStepIndex, steps.length]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Clear any existing timeouts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Execute step action if provided
    if (currentStep.action) {
      currentStep.action();
    }

    // Small delay to allow for any DOM updates from actions
    scrollTimeoutRef.current = setTimeout(() => {
      findAndHighlightElement(currentStep.target, currentStepIndex);
    }, 50); // Reduced from 100ms

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [currentStepIndex, currentStep, isActive, findAndHighlightElement]);

  // Reset tour when becoming active
  useEffect(() => {
    if (isActive) {
      console.log(`🚀 Tour: Starting tour with ${steps.length} steps`);
      setCurrentStepIndex(0);
      setTargetElement(null);
      setIsScrolling(false);
      retryCountRef.current = 0;
    } else {
      console.log(`🛑 Tour: Tour deactivated`);
      setTargetElement(null);
      setIsScrolling(false);
      // Clear timeouts when tour becomes inactive
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    }
  }, [isActive, steps.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <>
      {isActive && (
        <>
          <TourOverlay 
            targetElement={targetElement} 
            onClose={handleClose}
            isScrolling={isScrolling}
          />
          {targetElement && !isScrolling && (
            <TourTooltip
              step={currentStep}
              currentStep={currentStepIndex}
              totalSteps={steps.length}
              position={position}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
              onClose={handleClose}
            />
          )}
        </>
      )}
    </>
  );
}
