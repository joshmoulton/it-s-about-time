import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Zap, X } from 'lucide-react';

interface WelcomeViewProps {
  onModeChange: (mode: string) => void;
  onWhopSuccess: (user: any, authMethod: string) => void;
  onClose?: () => void;
  isLoading: boolean;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onModeChange,
  onWhopSuccess,
  onClose,
  isLoading
}) => {
  return (
    <div className="w-full relative p-4 sm:p-6">
      {/* Close button with proper functionality */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header - more compact for mobile */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
          Get access to Weekly Wizdom
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Access your Weekly Wizdom subscription and premium content
        </p>
      </div>

      {/* Primary CTA - Smaller for mobile */}
      <div className="mb-5 sm:mb-6">
        <Button
          onClick={() => onModeChange('magic')}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 sm:py-3 text-sm sm:text-base font-medium h-10 sm:h-12 flex items-center justify-center gap-2 text-center"
        >
          <Mail className="w-4 h-4" />
          <span className="flex-1 text-center">Get Access Link (Recommended)</span>
          <span>→</span>
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2 sm:mt-3 flex items-center justify-center gap-1 px-4">
          <Zap className="w-3 h-3" />
          Automatically verifies your Beehiiv subscription status
        </p>
      </div>

      {/* Alternative Options - Smaller for mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Button
          variant="outline"
          onClick={() => onModeChange('signin')}
          disabled={isLoading}
          className="py-2.5 sm:py-3 text-sm h-10 sm:h-12"
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => onModeChange('signup')}
          disabled={isLoading}
          className="py-2.5 sm:py-3 text-sm h-10 sm:h-12"
        >
          Create Account
        </Button>
      </div>

      {/* Account Types - More compact for mobile */}
      <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-border">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1">Premium Account</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Live Trading Signals, Exclusive Content, Full Access
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1">Free Account</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Newsletter Preview, Weekly Education Emails, Basic Market Insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};