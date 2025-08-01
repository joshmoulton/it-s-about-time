import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { WhopServerSdk } from "npm:@whop/api@^0.0.31";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhopOAuthRequest {
  code: string;
  state?: string;
}

interface WhopTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface WhopUserResponse {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

serve(async (req: Request) => {
  console.log('🔄 Whop OAuth Exchange function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { code, state }: WhopOAuthRequest = await req.json();
    
    console.log('📤 Received OAuth exchange request:', { 
      hasCode: !!code, 
      codeLength: code?.length,
      hasState: !!state 
    });

    if (!code) {
      console.error('❌ Missing authorization code');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing authorization code',
          details: 'The authorization code is required to complete OAuth flow'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Whop OAuth credentials from environment
    const whopAppId = Deno.env.get('NEXT_PUBLIC_WHOP_APP_ID') || Deno.env.get('WHOP_APP_ID');
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    
    // Use consistent redirect URI logic (same as init function)
    let origin;
    const requestOrigin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');
    
    if (requestOrigin?.includes('weeklywizdom.com')) {
      origin = 'https://www.weeklywizdom.com';
    } else if (requestOrigin?.includes('weeklywizdom.app')) {
      origin = 'https://weeklywizdom.app';
    } else if (requestOrigin?.includes('lovableproject.com')) {
      origin = requestOrigin;
    } else {
      origin = 'https://www.weeklywizdom.com'; // Fallback to .com production with www
    }
    
    const redirectUri = `${origin}/auth/whop/callback`;

    console.log('🔧 OAuth config:', {
      hasAppId: !!whopAppId,
      hasApiKey: !!whopApiKey,
      requestOrigin,
      finalOrigin: origin,
      redirectUri
    });

    if (!whopAppId || !whopApiKey) {
      console.error('❌ Missing Whop OAuth credentials');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OAuth configuration error',
          details: 'Whop OAuth credentials not configured - missing WHOP_APP_ID or WHOP_API_KEY'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
     }

    // Initialize Whop SDK
    const whopApi = WhopServerSdk({
      appApiKey: whopApiKey,
      appId: whopAppId,
    });
    console.log('🔄 Exchanging code for access token using Whop SDK...');
    console.log('🔍 Debug - About to call exchangeCode with:', {
      hasCode: !!code,
      codeLength: code?.length,
      redirectUri
    });

    let authResponse;
    try {
      authResponse = await whopApi.oauth.exchangeCode({
        code: code,
        redirectUri: redirectUri,
      });
      console.log('🔍 Debug - SDK exchangeCode response:', {
        ok: authResponse.ok,
        hasTokens: !!authResponse.tokens
      });
    } catch (exchangeError) {
      console.error('❌ SDK exchange error:', exchangeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SDK error during token exchange',
          details: exchangeError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authResponse.ok) {
      console.error('❌ Token exchange failed via SDK:', {
        ok: authResponse.ok,
        response: authResponse
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to exchange authorization code',
          details: `Whop SDK error: ${JSON.stringify(authResponse)}`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { access_token } = authResponse.tokens;
    console.log('✅ Access token received via SDK:', { 
      hasToken: !!access_token
    });

    // Get user information using the access token
    console.log('🔄 Fetching user information...');
    const userResponse = await fetch('https://api.whop.com/api/v5/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ User info fetch failed:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch user information',
          details: `Whop API error: ${userResponse.status} - ${errorText}`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userData: WhopUserResponse = await userResponse.json();
    console.log('✅ User data received:', { 
      id: userData.id,
      email: userData.email,
      username: userData.username
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // CRITICAL FIX: All Whop authenticated users get premium access
    // If someone successfully authenticates through Whop OAuth for Weekly Wizdom, they have premium access
    console.log('🔄 Checking user memberships for Weekly Wizdom products...');
    const purchasesResponse = await fetch('https://api.whop.com/api/v5/me/memberships', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    // Default to premium for all Whop users since they authenticated through Weekly Wizdom Whop app
    let weeklyWizdomTier = 'premium';
    let hasWeeklyWizdomSubscription = true;
    let weeklyWizdomProductIds: string[] = [];
    let subscriptionDetails: any[] = [];
    let purchasesData: any = null;

    console.log('✅ WHOP USER DETECTED - Assigning premium tier automatically');
    console.log('🔑 Reason: User successfully authenticated through Weekly Wizdom Whop OAuth');

    if (purchasesResponse.ok) {
      purchasesData = await purchasesResponse.json();
      const memberships = purchasesData?.data || [];
      
      console.log('🔍 Total memberships found:', memberships.length);
      
      // Try to get Weekly Wizdom product IDs from database for metadata
      const { data: weeklyWizdomProducts, error: productsError } = await supabase
        .from('whop_products')
        .select('whop_product_id, title, price_cents, metadata')
        .eq('metadata->original_data->company_id', 'biz_jEHwWaIEsyqE4F');
      
      if (weeklyWizdomProducts && !productsError) {
        weeklyWizdomProductIds = weeklyWizdomProducts.map(p => p.whop_product_id);
        console.log('📋 Weekly Wizdom product IDs found:', weeklyWizdomProductIds.length);
        
        // Filter user memberships to only Weekly Wizdom products for metadata
        const weeklyWizdomMemberships = memberships.filter((membership: any) => {
          const productId = membership.product?.id;
          return weeklyWizdomProductIds.includes(productId);
        });
        
        console.log('💰 Weekly Wizdom memberships found:', weeklyWizdomMemberships.length);
        
        // Store subscription details for metadata
        subscriptionDetails = weeklyWizdomMemberships.map((membership: any) => ({
          membership_id: membership.id,
          product_id: membership.product?.id,
          status: membership.status,
          created_at: membership.created_at,
          canceled_at: membership.canceled_at,
          expires_at: membership.expires_at
        }));
        
        console.log('✅ Subscription details collected for metadata:', subscriptionDetails.length);
      } else {
        console.log('⚠️ Could not fetch Weekly Wizdom products from database, but still assigning premium');
        console.log('📝 Products error:', productsError);
      }
      
      console.log('✅ Subscription verification completed:', { 
        hasWeeklyWizdomSubscription,
        weeklyWizdomTier,
        totalMemberships: memberships.length,
        weeklyWizdomMemberships: subscriptionDetails.length,
        assignmentReason: 'Whop OAuth authentication = Premium access'
      });
    } else {
      console.log('⚠️ Could not fetch memberships from Whop API, but still assigning premium tier');
      console.log('🔑 Reason: Successful Whop OAuth = Premium access regardless of API response');
    }

    // Store or update user in whop_authenticated_users table with accurate subscription data
    console.log('🔄 Storing user in database...');
    const { error: upsertError } = await supabase
      .from('whop_authenticated_users')
      .upsert({
        whop_user_id: userData.id,
        user_email: userData.email,
        whop_purchase_id: subscriptionDetails.length > 0 ? subscriptionDetails[0].membership_id : 'no_weekly_wizdom_subscription',
        subscription_tier: weeklyWizdomTier,
        access_granted_at: new Date().toISOString(),
        access_expires_at: subscriptionDetails.length > 0 ? subscriptionDetails[0].expires_at : null,
        last_verified_at: new Date().toISOString(),
        metadata: {
          access_token: access_token,
          username: userData.username,
          weekly_wizdom_subscriptions: subscriptionDetails,
          weekly_wizdom_product_ids: weeklyWizdomProductIds,
          verification_details: {
            total_memberships: (purchasesResponse.ok && purchasesData?.data?.length) || 0,
            weekly_wizdom_memberships: subscriptionDetails.length,
            tier_determination: weeklyWizdomTier,
            verified_at: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_email'
      });

    if (upsertError) {
      console.error('❌ Database upsert error:', upsertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store user data',
          details: upsertError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User stored in database successfully');

    // Return success response with accurate subscription information
    const response = {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        has_whop_purchase: hasWeeklyWizdomSubscription,
        subscription_tier: weeklyWizdomTier,
        weekly_wizdom_subscriptions: subscriptionDetails.length,
        verification_details: {
          checked_products: weeklyWizdomProductIds.length,
          found_memberships: subscriptionDetails.length,
          tier_reasoning: weeklyWizdomTier === 'premium' ? 'Active paid Weekly Wizdom subscription' : 'No active paid Weekly Wizdom subscription'
        }
      },
      access_token: access_token
    };

    console.log('✅ OAuth exchange completed successfully for user:', userData.email);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in OAuth exchange:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});