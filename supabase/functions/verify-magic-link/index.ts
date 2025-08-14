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

    // Validate the token in user_sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        *,
        beehiiv_subscribers!subscriber_id (
          id,
          email,
          subscription_tier,
          status
        )
      `)
      .eq('session_token', token)
      .eq('beehiiv_subscribers.email', email)
      .gt('expires_at', new Date().toISOString())
      .single();

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

    const subscriber = sessionData.beehiiv_subscribers;
    if (!subscriber) {
      console.error('❌ No subscriber found for session');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Valid token found for ${email}, tier: ${subscriber.subscription_tier}`);

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

    // Mark the user session as used
    await supabase
      .from('user_sessions')
      .update({ 
        used_at: new Date().toISOString(),
        metadata: { 
          ...sessionData.metadata, 
          supabase_user_id: authUser?.id,
          login_completed_at: new Date().toISOString()
        }
      })
      .eq('id', sessionData.id);

    // Log successful authentication
    await supabase
      .from('authentication_audit_log')
      .insert({
        user_email: email,
        auth_method: 'magic_link',
        action_type: 'login_success',
        metadata: {
          session_id: sessionData.id,
          subscription_tier: subscriber.subscription_tier,
          supabase_user_id: authUser?.id
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