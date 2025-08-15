import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface SessionRestorerProps {
  userEmail: string;
  onSessionRestored: () => void;
}

export const SessionRestorer: React.FC<SessionRestorerProps> = ({ userEmail, onSessionRestored }) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restoreSession = async () => {
    setIsRestoring(true);
    setError(null);
    
    try {
      console.log('🔄 Session restoration deprecated, redirecting to magic link system');
      
      // Redirect users to request a new magic link instead
      setError('Session restoration is no longer available. Please request a new magic link from the homepage.');
      setIsRestoring(false);
      return;
      
      console.log('🎯 Premium session restored successfully!');
      
      // Clear the restoration state
      localStorage.removeItem('last_known_premium_email');
      
      // Trigger the callback to update the app state
      onSessionRestored();
      
    } catch (error: any) {
      console.error('❌ Premium session restoration failed:', error);
      setError(error.message || 'Failed to restore premium session');
    } finally {
      setIsRestoring(false);
    }
  };

  // Auto-attempt to get session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Current session check:', { hasSession: !!session, userEmail: session?.user?.email });
      
      if (session?.user?.email === userEmail) {
        console.log('✅ Session found! Calling onSessionRestored');
        onSessionRestored();
      }
    };
    
    checkSession();
  }, [userEmail, onSessionRestored]);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Session Restoration
        </CardTitle>
        <CardDescription>
          Your session has expired. Click below to restore access to your premium content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Email: <span className="font-medium">{userEmail}</span>
        </div>
        
        {error && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border">
            {error}
          </div>
        )}
        
        <Button 
          onClick={restoreSession} 
          disabled={isRestoring}
          className="w-full"
        >
          {isRestoring ? 'Sending...' : 'Send Sign-In Link'}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          We'll send a magic link to restore your premium dashboard access.
        </div>
      </CardContent>
    </Card>
  );
};