import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface MagicLinkVerifyRequest {
  token: string;
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email }: MagicLinkVerifyRequest = await req.json();

    if (!token || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token and email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔍 Validating magic link token for: ${email}`);
    console.log('🔍 Received token:', token);
    console.log('🔍 Received email:', email);

    // Validate the token in user_sessions table and get associated subscriber
    console.log('🔍 Querying user_sessions table...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    console.log('🔍 Session query result:', { sessionData, sessionError });

    if (sessionError || !sessionData) {
      console.error('❌ Invalid or expired token:', sessionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired magic link token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call Beehiiv API directly for real-time tier verification
    console.log('🔍 Calling Beehiiv API for real-time tier verification...');
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77'; // Weekly Wizdom publication ID
    
    if (!beehiivApiKey || beehiivApiKey.length < 10) {
      console.error('❌ BEEHIIV_API_KEY missing or invalid');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication service temporarily unavailable' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Make direct API call to Beehiiv for fresh subscription data
    const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(email)}`;
    console.log(`📡 Making API request to: ${beehiivUrl}`);

    const beehiivResponse = await fetch(beehiivUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${beehiivApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Beehiiv API Response Status: ${beehiivResponse.status} ${beehiivResponse.statusText}`);

    let subscriber: { subscription_tier: 'free' | 'paid' | 'premium'; status: string } = {
      subscription_tier: 'free',
      status: 'active'
    };

    if (!beehiivResponse.ok) {
      if (beehiivResponse.status === 404) {
        console.log(`✅ Email not found in Beehiiv: ${email} - treating as free tier`);
        // Continue with free tier
      } else {
        console.error(`❌ Beehiiv API error: ${beehiivResponse.status}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Unable to verify subscription status' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      const beehiivData = await beehiivResponse.json();
      console.log(`✅ Beehiiv API response for ${email}:`, JSON.stringify(beehiivData, null, 2));

      if (beehiivData?.data) {
        const subscription = beehiivData.data;
        const apiTier = subscription.subscription_tier;
        
        // Determine tier from Beehiiv API response
        if (
          apiTier === 'premium' ||
          apiTier === 'Premium' ||
          (Array.isArray(subscription.subscription_premium_tier_names) && subscription.subscription_premium_tier_names.length > 0)
        ) {
          subscriber.subscription_tier = 'premium';
        } else if (apiTier === 'paid' || apiTier === 'Paid') {
          subscriber.subscription_tier = 'paid';
        } else {
          subscriber.subscription_tier = 'free';
        }
        
        subscriber.status = subscription.status || 'active';
      }
    }

    console.log(`✅ Valid token found for ${email}, live tier from Beehiiv API: ${subscriber.subscription_tier}`);

    // Check if Supabase auth user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    
    let authUser;
    if (existingUser.user) {
      // Update existing user's metadata with current tier
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.user.id,
        {
          user_metadata: {
            subscription_tier: subscriber.subscription_tier,
            source: 'beehiiv',
            verified_at: new Date().toISOString()
          }
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating user metadata:', updateError);
        throw updateError;
      }
      
      authUser = updatedUser.user;
      console.log(`✅ Updated existing Supabase user metadata for ${email}`);
    } else {
      // Create new Supabase auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          subscription_tier: subscriber.subscription_tier,
          source: 'beehiiv',
          verified_at: new Date().toISOString()
        }
      });
      
      if (createError) {
        console.error('❌ Error creating Supabase user:', createError);
        throw createError;
      }
      
      authUser = newUser.user;
      console.log(`✅ Created new Supabase user for ${email}`);
    }

    // Generate an access token for the user
    const { data: sessionResult, error: sessionCreateError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionCreateError || !sessionResult) {
      console.error('❌ Error generating session:', sessionCreateError);
      throw sessionCreateError;
    }

    // Mark the user session as used (update by token and email match)
    await supabase
      .from('user_sessions')
      .update({ 
        updated_at: new Date().toISOString(),
        metadata: { 
          supabase_user_id: authUser?.id,
          login_completed_at: new Date().toISOString(),
          used_for_login: true
        }
      })
      .eq('session_token', token);

    // Log successful authentication
    await supabase
      .from('authentication_audit_log')
      .insert({
        user_email: email,
        auth_method: 'magic_link',
        action_type: 'login_success',
        metadata: {
          session_token: token,
          subscription_tier: subscriber.subscription_tier,
          supabase_user_id: authUser?.id,
          source: sessionData.source
        }
      });

    console.log(`✅ Magic link verification successful for ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: authUser?.id,
          email: email,
          subscription_tier: subscriber.subscription_tier,
          source: 'beehiiv'
        },
        session: {
          access_token: sessionResult.properties?.access_token,
          refresh_token: sessionResult.properties?.refresh_token,
          expires_at: sessionResult.properties?.expires_at
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Magic link verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during verification' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});