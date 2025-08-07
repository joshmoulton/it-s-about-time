import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordSetupRequest {
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password }: PasswordSetupRequest = await req.json();
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    console.log(`🔐 Setting up password for: ${email}`);

    // First, verify the user exists in beehiiv_subscribers
    const { data: subscriber, error: subscriberError } = await supabase
      .from('beehiiv_subscribers')
      .select('id, email, subscription_tier, requires_password_setup')
      .eq('email', email)
      .single();

    if (subscriberError || !subscriber) {
      throw new Error('Subscriber not found');
    }

    if (!subscriber.requires_password_setup) {
      throw new Error('Password already set up for this account');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash the password using PostgreSQL's crypt function
    const { data: hashedPassword, error: hashError } = await supabase
      .rpc('hash_password', { password });

    if (hashError || !hashedPassword) {
      throw new Error('Failed to hash password');
    }

    // Update the subscriber with the new password
    const { error: updateError } = await supabase
      .from('beehiiv_subscribers')
      .update({
        password_hash: hashedPassword,
        requires_password_setup: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      throw new Error('Failed to update password');
    }

    // Verify Beehiiv subscription status
    console.log(`🔍 Verifying Beehiiv subscription for: ${email}`);
    
    const { data: beehiivResponse, error: beehiivError } = await supabase.functions.invoke(
      'beehiiv-subscriber-verify',
      { body: { email } }
    );

    if (beehiivError) {
      console.warn(`⚠️ Beehiiv verification failed for ${email}:`, beehiivError);
    } else if (beehiivResponse) {
      console.log(`✅ Beehiiv verification result for ${email}:`, beehiivResponse);
      
      // Update subscription tier if it has changed
      if (beehiivResponse.tier && beehiivResponse.tier !== subscriber.subscription_tier) {
        await supabase
          .from('beehiiv_subscribers')
          .update({
            subscription_tier: beehiivResponse.tier,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);
        
        console.log(`📊 Updated subscription tier for ${email} to: ${beehiivResponse.tier}`);
      }
    }

    // Log the password setup event
    await supabase
      .from('authentication_audit_log')
      .insert({
        user_email: email,
        auth_method: 'password_setup',
        action_type: 'password_created',
        metadata: {
          timestamp: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        }
      });

    console.log(`✅ Password setup completed for: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password set up successfully',
        subscription_tier: beehiivResponse?.tier || subscriber.subscription_tier
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Password setup error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to set up password'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);