
import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface WhopCallbackLoadingProps {
  status: string;
}

export const WhopCallbackLoading: React.FC<WhopCallbackLoadingProps> = ({ status }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold">Completing Whop Authentication</h2>
        <p className="text-muted-foreground">{status}</p>
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Secure OAuth flow in progress</span>
        </div>
      </div>
    </div>
  );
};
