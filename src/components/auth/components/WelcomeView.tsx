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
    <div className="w-full relative p-6">
      {/* Simple close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Get access to Weekly Wizdom
        </h2>
        <p className="text-muted-foreground">
          Access your Weekly Wizdom subscription and premium content
        </p>
      </div>

      {/* Primary CTA - Magic Link */}
      <div className="mb-6">
        <Button
          onClick={() => onModeChange('magic')}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-medium h-12 flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Get Access Link (Recommended)
          <span className="ml-auto">→</span>
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" />
          Automatically verifies your Beehiiv subscription status
        </p>
      </div>

      {/* Alternative Options */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => onModeChange('signin')}
          disabled={isLoading}
          className="py-3 text-sm h-12"
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => onModeChange('signup')}
          disabled={isLoading}
          className="py-3 text-sm h-12"
        >
          Create Account
        </Button>
      </div>

      {/* Account Types */}
      <div className="space-y-4 pt-6 border-t border-border">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Premium Account</h4>
            <p className="text-sm text-muted-foreground">
              Live Trading Signals, Exclusive Content, Full Access
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Free Account</h4>
            <p className="text-sm text-muted-foreground">
              Newsletter Preview, Weekly Education Emails, Basic Market Insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};