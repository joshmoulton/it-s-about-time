
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface WhopCallbackErrorProps {
  error: string;
}

export const WhopCallbackError: React.FC<WhopCallbackErrorProps> = ({ error }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Authentication Failed</strong>
            <br />
            {error}
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-3">
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Try Different Login Method
          </Button>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 underline text-sm"
          >
            Retry Whop Authentication
          </button>
        </div>
        
        <div className="text-xs text-center text-muted-foreground">
          Need help? Contact support with error details above.
        </div>
      </div>
    </div>
  );
};
