
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { WhopOAuthButton } from './WhopOAuthButton';

interface AuthOptionsModalContentProps {
  isLoading: boolean;
  onWhopSuccess: (user: any, authMethod: string) => void;
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export const AuthOptionsModalContent: React.FC<AuthOptionsModalContentProps> = ({
  isLoading,
  onWhopSuccess,
  onSignInClick,
  onSignUpClick
}) => {
  return (
    <>
      <DialogHeader className="text-center pb-4">
        <DialogTitle className="text-2xl font-bold">Welcome to Weekly Wizdom</DialogTitle>
        <p className="text-muted-foreground">Choose how you'd like to continue</p>
      </DialogHeader>
      
      <div className="space-y-3">
        {/* Whop OAuth Button */}
        <WhopOAuthButton 
          onSuccess={onWhopSuccess}
          disabled={isLoading}
        />

        {/* Magic Link Option */}
        <Button
          variant="default"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onSignInClick}
          disabled={isLoading}
        >
          <Mail className="h-4 w-4 mr-2" />
          Magic Link
          <span className="text-xs ml-2 opacity-80">(no password needed)</span>
        </Button>

        {/* Email & Password Sign In */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => {
            // For now, we'll route to sign-in, but we can add logic later to show both sign-in and sign-up
            onSignInClick();
          }}
          disabled={isLoading}
        >
          <Lock className="h-4 w-4 mr-2" />
          Sign In with Email & Password
        </Button>
      </div>
    </>
  );
};
