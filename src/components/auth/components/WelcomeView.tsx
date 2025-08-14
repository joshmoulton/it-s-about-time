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
    <div className="w-full relative">
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Get access to Weekly Wizdom
        </h2>
        <p className="text-sm text-muted-foreground">
          Access your Weekly Wizdom subscription and premium content
        </p>
      </div>

      {/* Primary CTA - Magic Link */}
      <div className="mb-4">
        <Button
          onClick={() => onModeChange('magic')}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-sm font-semibold"
        >
          Get Access Link (Recommended)
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" />
          Automatically verifies your Beehiiv subscription status
        </p>
      </div>

      {/* Alternative Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          variant="outline"
          onClick={() => onModeChange('signin')}
          disabled={isLoading}
          className="py-2.5 text-sm"
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => onModeChange('signup')}
          disabled={isLoading}
          className="py-2.5 text-sm"
        >
          Create Account
        </Button>
      </div>

      {/* Account Types */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm text-foreground">Premium Account</h4>
            <p className="text-xs text-muted-foreground">Live Trading Signals, Exclusive Content, Full Access</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm text-foreground">Free Account</h4>
            <p className="text-xs text-muted-foreground">Newsletter Updates, Community Access</p>
          </div>
        </div>
      </div>
    </div>
  );
};