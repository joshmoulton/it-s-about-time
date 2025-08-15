import React from 'react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export const AuthDebugPanel: React.FC = () => {
  const { currentUser, isLoading, refreshCurrentUser } = useEnhancedAuth();

  const handleRefreshAuth = async () => {
    try {
      console.log('🔄 Refreshing authentication...');
      
      // Check current Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current Supabase session:', session?.user?.email || 'None');
      
      // Check localStorage
      const cachedEmail = localStorage.getItem('auth_user_email');
      const sessionToken = localStorage.getItem('enhanced_session_token');
      const authMethod = localStorage.getItem('auth_method');
      
      console.log('Cached auth data:', { cachedEmail, hasSessionToken: !!sessionToken, authMethod });
      
      // If we have cached auth but no Supabase session, try to bridge
      if (cachedEmail && sessionToken && !session?.user) {
        console.log('🌉 Attempting to bridge cached session to Supabase...');
        
        // Bridge function is deprecated - direct users to request new magic link
        console.log('⚠️ Bridge function deprecated - user should request new magic link');
        toast.info('Session bridging is no longer available. Please request a new magic link from the homepage.');
      } else if (refreshCurrentUser) {
        await refreshCurrentUser();
        toast.success('User data refreshed!');
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      toast.error('Authentication refresh failed');
    }
  };

  const handleForceLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (!currentUser) return null;

  return (
    <Card className="mb-4 border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Auth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs space-y-1">
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Tier:</strong> {currentUser.subscription_tier}</p>
          <p><strong>Type:</strong> {currentUser.user_type}</p>
          <p><strong>Loading:</strong> {isLoading.toString()}</p>
          <p><strong>Auth Method:</strong> {localStorage.getItem('auth_method') || 'none'}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefreshAuth}
          >
            Refresh Auth
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleForceLogout}
          >
            Force Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};