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
    <div className="bg-background/98 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto border border-border/60 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 opacity-70"></div>
      <div className="relative z-10">
        {/* Close button with proper functionality */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 z-20 bg-background/90 hover:bg-background rounded-full p-2 shadow-md backdrop-blur-sm border border-border/30"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header - optimized for mobile */}
        <div className="text-center mb-8 pt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg backdrop-blur-sm border border-primary/20">
            <Mail className="w-8 h-8 text-primary drop-shadow-sm" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/90 bg-clip-text text-transparent mb-3 leading-tight">
            Get access to Weekly Wizdom
          </h2>
          <p className="text-base text-muted-foreground/90 px-1 leading-relaxed">
            Access your Weekly Wizdom subscription and premium content
          </p>
        </div>

        {/* Primary CTA - Enhanced for mobile */}
        <div className="mb-6">
          <Button
            onClick={() => onModeChange('magic')}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/95 hover:to-primary/95 text-primary-foreground py-3 text-base font-semibold h-12 sm:h-14 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-center px-2">Get Access Link (Recommended)</span>
            <span className="text-lg flex-shrink-0">→</span>
          </Button>
          <div className="text-xs sm:text-sm text-muted-foreground/80 text-center mt-3 flex items-center justify-center gap-2 px-3 bg-muted/20 py-2 rounded-lg backdrop-blur-sm border border-border/30">
            <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span className="leading-tight">Automatically verifies your Beehiiv subscription status</span>
          </div>
        </div>

        {/* Alternative Options - Enhanced styling */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Button
            variant="outline"
            onClick={() => onModeChange('signin')}
            disabled={isLoading}
            className="py-3 text-sm h-11 sm:h-12 border-2 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.01] font-medium rounded-xl disabled:opacity-50"
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            onClick={() => onModeChange('signup')}
            disabled={isLoading}
            className="py-3 text-sm h-11 sm:h-12 border-2 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.01] font-medium rounded-xl disabled:opacity-50"
          >
            Create Account
          </Button>
        </div>

        {/* Account Types - Enhanced compact design */}
        <div className="space-y-3 pt-5 border-t border-border/40">
          <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-orange-50/60 to-orange-100/40 rounded-xl border border-orange-200/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-orange-700 mb-1">Premium Account</h4>
              <p className="text-xs text-orange-600 leading-tight">
                Live Trading Signals, Exclusive Content, Full Access
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50/60 to-blue-100/40 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-blue-700 mb-1">Free Account</h4>
              <p className="text-xs text-blue-600 leading-tight">
                Newsletter Preview, Weekly Education Emails, Basic Market Insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};