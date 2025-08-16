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
    <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-lg mx-auto border border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-60"></div>
      <div className="relative z-10">
        {/* Close button with proper functionality */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 z-10 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg backdrop-blur-sm"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header - more compact for mobile */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm border border-primary/20">
            <Mail className="w-10 h-10 text-primary drop-shadow-sm" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3">
            Get access to Weekly Wizdom
          </h2>
          <p className="text-lg text-muted-foreground px-2">
            Access your Weekly Wizdom subscription and premium content
          </p>
        </div>

        {/* Primary CTA - Enhanced for mobile */}
        <div className="mb-8">
          <Button
            onClick={() => onModeChange('magic')}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground py-4 text-base font-semibold h-14 flex items-center justify-center gap-3 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl"
          >
            <Mail className="w-5 h-5" />
            <span className="flex-1 text-center">Get Access Link (Recommended)</span>
            <span className="text-lg">→</span>
          </Button>
          <div className="text-sm text-muted-foreground text-center mt-4 flex items-center justify-center gap-2 px-4 bg-muted/30 py-2 rounded-lg backdrop-blur-sm">
            <Zap className="w-4 h-4 text-orange-500" />
            Automatically verifies your Beehiiv subscription status
          </div>
        </div>

        {/* Alternative Options - Enhanced styling */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Button
            variant="outline"
            onClick={() => onModeChange('signin')}
            disabled={isLoading}
            className="py-4 text-sm h-14 border-2 hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] font-semibold rounded-xl"
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            onClick={() => onModeChange('signup')}
            disabled={isLoading}
            className="py-4 text-sm h-14 border-2 hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] font-semibold rounded-xl"
          >
            Create Account
          </Button>
        </div>

        {/* Account Types - Enhanced compact design */}
        <div className="space-y-5 pt-6 border-t border-border/50">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-2xl border border-orange-200/40 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-base text-orange-700 mb-1">Premium Account</h4>
              <p className="text-sm text-orange-600">
                Live Trading Signals, Exclusive Content, Full Access
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-2xl border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-base text-blue-700 mb-1">Free Account</h4>
              <p className="text-sm text-blue-600">
                Newsletter Preview, Weekly Education Emails, Basic Market Insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};