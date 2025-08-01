
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoginButtonProps {
  isLoading: boolean;
  method: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ isLoading, method }) => {
  return (
    <Button
      type="submit"
      className="w-full h-12 bg-gradient-brand hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold text-base"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {method === 'signin' ? 'Signing in...' : method === 'signup' ? 'Registering...' : 'Verifying...'}
        </>
      ) : (
        <>
          {method === 'signin'
            ? 'Sign In'
            : method === 'signup'
            ? 'Create Account'
            : 'Access My Content'}
        </>
      )}
    </Button>
  );
};
