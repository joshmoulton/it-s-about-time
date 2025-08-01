
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { EnhancedLoginForm } from '@/components/auth/EnhancedLoginForm';

const EnhancedLogin = () => {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useEnhancedAuth();

  const handleLoginSuccess = (user: any, authMethod: string) => {
    console.log('🎉 Login successful:', user.email, authMethod);
    setAuthenticatedUser(user, authMethod);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <EnhancedLoginForm onSuccess={handleLoginSuccess} />
        
        <div className="mt-6 text-center space-y-3">
          <div className="text-sm text-muted-foreground/70">
            <p>New to Weekly Wizdom?</p>
            <a
              href="https://weekwiz.beehiiv.com/subscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Subscribe to the Newsletter
            </a>
          </div>
          <div className="text-sm text-muted-foreground/70">
            <p>Want premium access?</p>
            <a
              href="https://www.weeklywizdom.com/c/upgrade-membership"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
            >
              Upgrade to Premium
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;
