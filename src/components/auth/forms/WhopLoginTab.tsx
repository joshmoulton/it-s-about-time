
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WhopOAuthButton } from '@/components/auth/WhopOAuthButton';
import { RememberMeOption } from '@/components/auth/RememberMeOption';

interface WhopLoginTabProps {
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
  onSuccess: (user: any, authMethod: string) => void;
  isLoading: boolean;
  error: string;
}

export const WhopLoginTab: React.FC<WhopLoginTabProps> = ({
  rememberMe,
  onRememberMeChange,
  onSuccess,
  isLoading,
  error
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Sign in with your Whop account to access premium features
      </p>
      
      <RememberMeOption
        checked={rememberMe}
        onCheckedChange={onRememberMeChange}
        disabled={isLoading}
      />
      
      <WhopOAuthButton 
        onSuccess={onSuccess}
        disabled={isLoading}
      />
      
      {error && (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
