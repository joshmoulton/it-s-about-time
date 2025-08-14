import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...corsHeaders },
    ...init,
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return json({ 
        success: false, 
        error: 'Token and email are required' 
      }, { status: 400 });
    }

    console.log(`🔍 Validating magic link token for: ${email}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Hash the incoming token to match what's stored in the database
    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
      .then(buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Validate the hashed token in magic_links table
    const { data: magicLink, error: magicLinkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', tokenHash) // Compare with hashed token
      .eq('email', email.toLowerCase().trim())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (magicLinkError || !magicLink) {
      console.error('❌ Invalid or expired token:', magicLinkError);
      return json({ 
        success: false, 
        error: 'Invalid or expired magic link token' 
      }, { status: 401 });
    }

    // Call Beehiiv API directly for real-time tier verification
    console.log('🔍 Calling Beehiiv API for real-time tier verification...');
    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = 'pub_e08d5f43-7f7c-4c24-b546-f301ccd42a77';
    
    if (!beehiivApiKey || beehiivApiKey.length < 10) {
      console.error('❌ BEEHIIV_API_KEY missing or invalid');
      return json({ 
        success: false, 
        error: 'Authentication service temporarily unavailable' 
      }, { status: 500 });
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
        return json({ 
          success: false, 
          error: 'Unable to verify subscription status' 
        }, { status: 500 });
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

    // Check if Supabase auth user already exists by listing users with email filter
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000 
    });
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      throw listError;
    }
    
    const existingUser = usersList.users.find(user => user.email === email);
    
    let authUser;
    if (existingUser) {
      // Update existing user's metadata with current tier
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
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

    // Generate an access token for the user using generateLink
    const { data: sessionResult, error: sessionCreateError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionCreateError || !sessionResult) {
      console.error('❌ Error generating session:', sessionCreateError);
      throw sessionCreateError;
    }

    // Mark the magic link as used (using the hashed token)
    await supabase
      .from('magic_links')
      .update({ 
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', tokenHash); // Use hashed token here too

    // Log successful authentication
    await supabase
      .from('authentication_audit_log')
      .insert({
        user_email: email,
        auth_method: 'magic_link',
        action_type: 'login_success',
        metadata: {
          token: token.substring(0, 8) + '...',
          subscription_tier: subscriber.subscription_tier,
          supabase_user_id: authUser?.id,
          source: 'magic_link_verify'
        }
      });

    console.log(`✅ Magic link verification successful for ${email}`);

    return json({ 
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
    });

  } catch (error) {
    console.error('❌ Magic link verification error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error during verification' 
    }, { status: 500 });
  }
});