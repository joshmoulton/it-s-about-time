import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Alert {
  id: string;
  ticker: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  target: number;
  created_at: string;
  caller: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user info for access control
    let userEmail: string | null = null;
    let isAdmin = false;
    let isPremiumUser = false;

    try {
      // Create client with user's token for RLS
      const userSupabase = createClient(
        supabaseUrl, 
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      );

      const { data: { user } } = await userSupabase.auth.getUser();
      userEmail = user?.email || null;

      // Check user access (admin or premium)
      if (userEmail) {
        // Check admin status
        const { data: adminData } = await supabase
          .rpc('is_current_user_admin_fast')
          .single();
        isAdmin = adminData || false;

        // Check premium subscription
        const { data: userData } = await supabase
          .from('beehiiv_subscribers')
          .select('subscription_tier')
          .eq('email', userEmail)
          .single();
        
        isPremiumUser = userData?.subscription_tier === 'premium' || userData?.subscription_tier === 'paid';
      }
    } catch (error) {
      console.error('Error checking user auth:', error);
    }

    // Only allow access to premium users or admins
    if (!isAdmin && !isPremiumUser) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mock active alerts data for premium users and admins
    const mockAlerts: Alert[] = [
      {
        id: '1',
        ticker: 'BTC',
        direction: 'Long',
        entry_price: 118380,
        stop_loss: 116535,
        target: 125000,
        created_at: new Date().toISOString(),
        caller: 'Pidgeonn',
        status: 'active'
      },
      {
        id: '2', 
        ticker: 'ETH',
        direction: 'Long',
        entry_price: 4340,
        stop_loss: 4250,
        target: 4600,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        caller: 'CryptoAnalyst',
        status: 'pending'
      }
    ];

    const response = {
      alerts: mockAlerts,
      tradingCount: 1,
      awaitingCount: 1,
      totalCount: 2,
      isConnected: true,
      lastUpdate: new Date().toISOString(),
      userEmail,
      isAdmin
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Active alerts error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});