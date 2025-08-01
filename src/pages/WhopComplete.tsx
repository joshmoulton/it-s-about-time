import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { SimplifiedAuth } from '@/utils/simplifiedAuthUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

const WhopComplete = () => {
  const [status, setStatus] = useState('Processing Whop authentication...');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useEnhancedAuth();
  const { toast } = useToast();

  useEffect(() => {
    const completeWhopAuth = async () => {
      try {
        console.log('🔄 Completing Whop authentication...');
        setStatus('Verifying Whop access token...');

        // Get the Whop access token from cookies (set by the exchange function)
        const cookies = document.cookie.split(';');
        const whopTokenCookie = cookies.find(cookie => 
          cookie.trim().startsWith('whop_access_token=')
        );

        if (!whopTokenCookie) {
          throw new Error('No Whop access token found');
        }

        const whopToken = whopTokenCookie.split('=')[1];
        console.log('✅ Found Whop access token');

        setStatus('Fetching user information from Whop...');

        // Fetch user info using the Whop token
        const userResponse = await fetch('https://api.whop.com/v5/me', {
          headers: {
            'Authorization': `Bearer ${whopToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user information from Whop');
        }

        const userData = await userResponse.json();
        console.log('✅ User data received from Whop:', userData.email);

        setStatus('Completing authentication...');

        // Use the simplified auth system to complete login
        const userEmail = userData.email || userData.username || `user_${userData.id}`;
        
        // Log the auth event
        await SimplifiedAuth.logAuthEvent(userEmail, 'whop_login', true);
        
        // CRITICAL FIX: Whop authenticated users are ALWAYS premium
        // Anyone who authenticates through Whop OAuth has guaranteed premium access
        console.log('🔍 WhopComplete - Whop user authenticated, assigning premium tier');
        
        const tier = 'premium'; // Always premium for Whop users
        const isAdmin = await SimplifiedAuth.isAdmin(userEmail);
        
        console.log('✅ WhopComplete - final tier:', tier, 'isAdmin:', isAdmin);
        
        const user = {
          id: userData.id,
          email: userEmail,
          subscription_tier: tier,
          user_type: isAdmin ? 'whop_admin' : 'whop_user' as const
        };
        
        console.log('✅ Simplified auth completed successfully');
        setAuthenticatedUser(user, 'whop');
          
          // Clear the Whop token cookie (it's been processed)
          document.cookie = 'whop_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          
          toast({
            title: "Welcome!",
            description: `Successfully authenticated with Whop as ${userData.email || userData.username}`,
          });
          
          navigate('/dashboard');

      } catch (error) {
        console.error('❌ Whop completion error:', error);
        setError('An unexpected error occurred during authentication.');
      }
    };

    completeWhopAuth();
  }, [navigate, setAuthenticatedUser, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-red-500 text-xl">Authentication Failed</div>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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

export default WhopComplete;