import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, CheckCircle, Sparkles, Zap } from 'lucide-react';
import { TourPlacement } from '@/hooks/useTourPositioning';
export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  placement: TourPlacement;
  action?: () => void;
  welcomeMessage?: string;
  feature?: string;
  benefit?: string;
  proTip?: string;
}
interface TourTooltipProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  position: {
    x: number;
    y: number;
    placement: TourPlacement;
  };
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
}
export function TourTooltip({
  step,
  currentStep,
  totalSteps,
  position,
  onNext,
  onPrevious,
  onSkip,
  onClose
}: TourTooltipProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isChatHighlightsSentimentStep = step.id === 'chat-highlights-sentiment';
  
  let adjustedPosition = { ...position };
  
  // Special positioning for chat highlights & sentiment step to avoid overlap
  if (isChatHighlightsSentimentStep) {
    // Move tooltip to the top-center to avoid overlapping with the widgets
    adjustedPosition = {
      ...position,
      x: window.innerWidth / 2 - 210, // Center horizontally (210 is half of tooltip width)
      y: Math.max(20, position.y - 200), // Move up significantly
      placement: 'bottom' as const // Point downward toward the widgets
    };
  }
  
  const tooltipStyle = {
    position: 'fixed' as const,
    left: Math.max(16, Math.min(adjustedPosition.x, window.innerWidth - 16)),
    // Ensure it stays within viewport
    top: Math.max(16, Math.min(adjustedPosition.y, window.innerHeight - 16)),
    // Ensure it stays within viewport
    width: 'auto',
    maxWidth: 'calc(100vw - 32px)',
    minWidth: '280px',
    zIndex: 10000,
    pointerEvents: 'auto' as const,
    animation: 'tourFadeIn 0.3s ease-out'
  };

  // Mobile responsive adjustments
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
  if (isMobile) {
    tooltipStyle.width = 'calc(100vw - 24px)';
    tooltipStyle.maxWidth = '360px';
    tooltipStyle.minWidth = '280px';
    tooltipStyle.left = Math.max(12, Math.min(adjustedPosition.x, window.innerWidth - 12));
    tooltipStyle.top = Math.max(12, Math.min(adjustedPosition.y, window.innerHeight - 12));
  } else if (isTablet) {
    tooltipStyle.width = '380px';
    tooltipStyle.maxWidth = 'calc(100vw - 48px)';
  } else {
    tooltipStyle.width = '420px';
  }
  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0 border-solid";
    const borderColor = "border-white dark:border-gray-900";
    switch (adjustedPosition.placement) {
      case 'top':
        return `${baseClasses} ${borderColor} border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-b-0 -bottom-3 left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} ${borderColor} border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-t-0 -top-3 left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} ${borderColor} border-t-[12px] border-b-[12px] border-l-[12px] border-t-transparent border-b-transparent border-r-0 -right-3 top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} ${borderColor} border-t-[12px] border-b-[12px] border-r-[12px] border-t-transparent border-b-transparent border-l-0 -left-3 top-1/2 transform -translate-y-1/2`;
      default:
        return '';
    }
  };

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tourFadeIn {
        0% {
          opacity: 0;
          transform: translateY(10px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes tourPulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }
      
      @keyframes tourGlow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        50% {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return <div style={tooltipStyle}>
      <Card className={`shadow-2xl border-2 bg-white dark:bg-gray-900 backdrop-blur-sm border-blue-500 dark:border-blue-400 ${isMobile ? 'text-sm mx-2' : ''}`} style={{
      animation: 'tourGlow 3s ease-in-out infinite'
    }}>
        
        
        {/* Header */}
        <CardHeader className={`pb-0 pt-4 relative ${isMobile ? 'px-4' : 'px-6'}`}>
          <Button variant="ghost" size="sm" onClick={onClose} className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 rounded-full transition-colors">
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}>
                {isFirstStep ? <Sparkles className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} /> : currentStep + 1}
              </div>
            </div>
            
            <div className="flex-1">
              <CardTitle className={`font-bold text-gray-900 dark:text-white leading-tight ${isMobile ? 'text-base' : 'text-lg'}`}>
                {step.title}
              </CardTitle>
              
            </div>
          </div>
          
          
        </CardHeader>

        <CardContent className={`space-y-4 pb-6 pt-4 ${isMobile ? 'px-4 space-y-3' : 'px-6'}`}>
          {/* Main content */}
          <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
            <CardDescription className={`text-gray-700 dark:text-gray-300 leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
              {step.content}
            </CardDescription>
            
            {/* Pro Tip - Green box */}
            {step.proTip && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 dark:text-green-200 font-medium text-sm">Pro Tip:</p>
                    <p className="text-green-700 dark:text-green-300 text-sm mt-1">{step.proTip}</p>
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Progress indicators */}
          <div className={`flex justify-center items-center space-x-2 ${isMobile ? 'py-1' : 'py-2'}`}>
            {Array.from({
            length: totalSteps
          }, (_, index) => <div key={index} className={`rounded-full transition-all duration-300 ${isMobile ? 'h-1.5' : 'h-2'} ${index === currentStep ? `bg-blue-500 shadow-lg ${isMobile ? 'w-6' : 'w-8'}` : index < currentStep ? `bg-blue-400 ${isMobile ? 'w-1.5' : 'w-2'}` : `bg-gray-300 dark:bg-gray-600 ${isMobile ? 'w-1.5' : 'w-2'}`}`} />)}
          </div>


          {/* Navigation buttons - Better mobile layout */}
          <div className={`flex items-center justify-between pt-2 ${isMobile ? 'gap-1 flex-wrap' : 'gap-3'}`}>
            {/* Previous button */}
            <div className={isMobile ? 'order-1 flex-1' : 'flex-1'}>
              {currentStep > 0 ? <Button variant="outline" size={isMobile ? "sm" : "sm"} onClick={onPrevious} className={`w-full flex items-center justify-center border-gray-300 dark:border-gray-600 ${isMobile ? 'gap-1 px-2 text-xs h-8' : 'gap-2'}`}>
                  <ChevronLeft className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  {isMobile ? 'Back' : 'Previous'}
                </Button> : <div className="w-full"></div>}
            </div>

            {/* Skip button */}
            <div className={`flex gap-1 ${isMobile ? 'order-3 w-full justify-center mt-2' : 'flex-shrink-0'}`}>
              <Button variant="ghost" size="sm" onClick={onSkip} className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${isMobile ? 'px-3 text-xs h-7' : 'px-3'}`}>
                {isMobile ? 'Skip Tour' : 'Skip Tour'}
              </Button>
            </div>

            {/* Next/Finish button */}
            <div className={isMobile ? 'order-2 flex-1' : 'flex-1'}>
              <Button size={isMobile ? "sm" : "sm"} onClick={onNext} className={`w-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${isMobile ? 'gap-1 px-2 text-xs h-8' : 'gap-2'} ${isLastStep ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'}`}>
                {isLastStep ? <>
                    <CheckCircle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {isMobile ? 'Finish!' : 'Start Trading!'}
                  </> : <>
                    Next
                    <ChevronRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}