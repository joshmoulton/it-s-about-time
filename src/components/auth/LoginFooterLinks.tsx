
import React from 'react';

interface LoginFooterLinksProps {
  method: string;
  onTabClick: (tabKey: string) => void;
}

export const LoginFooterLinks: React.FC<LoginFooterLinksProps> = ({ method, onTabClick }) => {
  return (
    <div className="mt-6 text-center text-sm">
      {method === 'signin' && (
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Forgot your password?{' '}
            <a
              href="https://weekwiz.beehiiv.com/forgot-password"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Reset it
            </a>
          </p>
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onTabClick('signup')}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Create Account
            </button>
          </p>
        </div>
      )}
      {method === 'signup' && (
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onTabClick('signin')}
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
          >
            Sign In
          </button>
        </p>
      )}
      {method === 'magic' && (
        <div className="space-y-3">
          <div className="text-muted-foreground">
            <p>Don't have a subscription?</p>
            <a
              href="https://weekwiz.beehiiv.com/subscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Subscribe to Weekly Wizdom
            </a>
          </div>
          <p className="text-muted-foreground">
            Already have a password?{' '}
            <button
              type="button"
              onClick={() => onTabClick('signin')}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
