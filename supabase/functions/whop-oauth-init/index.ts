import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { WhopServerSdk } from "npm:@whop/api@^0.0.31"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


serve(async (req) => {
  console.log('🔄 Whop OAuth init request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { next }: { next?: string } = req.method === 'POST' ? await req.json() : {}
    const nextUrl = next || '/dashboard'

    const whopAppId = Deno.env.get('NEXT_PUBLIC_WHOP_APP_ID') || Deno.env.get('WHOP_APP_ID')
    const whopApiKey = Deno.env.get('WHOP_API_KEY')
    
    console.log('🔐 Environment check:', { 
      hasAppId: !!whopAppId, 
      hasApiKey: !!whopApiKey,
      appIdLength: whopAppId?.length 
    });

    if (!whopAppId || !whopApiKey) {
      console.error('❌ Missing Whop OAuth credentials in environment');
      return new Response(
        JSON.stringify({ success: false, error: 'OAuth not configured - missing WHOP_APP_ID or WHOP_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🚀 Creating OAuth authorization URL using Whop SDK...');
    
    // Initialize Whop SDK
    const whopApi = WhopServerSdk({
      appApiKey: whopApiKey,
      appId: whopAppId,
    });
    
    // Use consistent origin logic - prioritize .com domain
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
    
    console.log('📍 OAuth redirect URI setup:', {
      requestOrigin,
      finalOrigin: origin,
      redirectUri
    });
    
    // Use Whop SDK to generate the authorization URL
    const { url: authUrl, state } = whopApi.oauth.getAuthorizationUrl({
      redirectUri: redirectUri,
      scope: ["read_user"], // Correct scope format for Whop
    });

    console.log('✅ OAuth URL generated successfully');
    console.log('🔗 Authorization URL:', authUrl);
    console.log('🔐 State:', state);
    
    // Return JSON response for client to handle redirect
    return new Response(
      JSON.stringify({
        success: true,
        authUrl: authUrl,
        state: state,
        redirectUri: redirectUri
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          "Set-Cookie": `oauth-state.${state}=${encodeURIComponent(nextUrl)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
        }
      }
    );

  } catch (error) {
    console.error('❌ Whop OAuth init error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during OAuth initialization',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})