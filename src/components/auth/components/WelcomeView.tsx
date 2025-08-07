
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Zap, ArrowRight, X } from 'lucide-react';


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
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto relative">
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      {/* Email Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Get access to Weekly Wizdom
        </h2>
        <p className="text-gray-600">
          Access your Weekly Wizdom subscription and premium content
        </p>
      </div>

      {/* Primary CTA - Magic Link */}
      <div className="mb-6">
        <Button
          onClick={() => onModeChange('magic')}
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
        >
          <Mail className="w-5 h-5 mr-3" />
          Continue with Email
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Tertiary CTAs - Sign In & Create Account */}
      <div className="flex gap-3 mb-8">
        <Button
          onClick={() => onModeChange('signin')}
          disabled={isLoading}
          className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition-colors"
        >
          Sign In
        </Button>
        <Button
          onClick={() => onModeChange('signup')}
          disabled={isLoading}
          className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition-colors"
        >
          Create Account
        </Button>
      </div>

      {/* Account Tier Descriptions */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Zap className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Premium Account</h4>
            <p className="text-xs text-gray-600">
              Live Trading Signals, Exclusive Content, Full Access
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Mail className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Free Account</h4>
            <p className="text-xs text-gray-600">
              Newsletter Preview, Weekly Education Emails, Basic Market Insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
