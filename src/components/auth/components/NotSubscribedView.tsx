import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, UserPlus } from 'lucide-react';

interface NotSubscribedViewProps {
  email: string;
  onModeChange: (mode: string) => void;
  onEmailChange: (email: string) => void;
}

export const NotSubscribedView: React.FC<NotSubscribedViewProps> = ({
  email,
  onModeChange,
  onEmailChange
}) => {
  const handleSignUpClick = () => {
    // Keep the email they entered
    onModeChange('signup');
  };

  const handleBackClick = () => {
    onModeChange('welcome');
  };

  return (
    <div className="relative overflow-hidden bg-brand-white border border-gray-200 rounded-2xl p-8 shadow-xl">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>

        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Email Not Found
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find <span className="font-medium">{email}</span> in our subscriber database. 
            Magic links are only available for existing subscribers.
          </p>
        </div>

        {/* Next Steps */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              What would you like to do?
            </h3>
            <div className="space-y-3">
              <Button
                onClick={handleSignUpClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Free Account
              </Button>
              
              <p className="text-sm text-gray-600">
                Sign up for free and get access to Weekly Wizdom's basic features.
                You can upgrade to premium anytime.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="w-full text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login options
            </Button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500">
            Already have an account? Try signing in with email and password instead.
          </p>
        </div>
      </div>
    </div>
  );
};
