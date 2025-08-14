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
      console.log('🔄 Attempting to restore session for:', userEmail);
      
      // Try to sign in the existing user with a temporary password reset flow
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      });
      
      if (signInError) {
        throw signInError;
      }
      
      console.log('✅ OTP sent successfully, check your email');
      setError('Please check your email for a sign-in link.');
      
    } catch (error: any) {
      console.error('❌ Session restoration failed:', error);
      setError(error.message || 'Failed to restore session');
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