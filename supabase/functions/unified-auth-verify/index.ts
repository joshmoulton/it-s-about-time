import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface VerificationResult {
  success: boolean;
  verified: boolean;
  tier: 'free' | 'paid' | 'premium';
  source: 'beehiiv' | 'none';
  metadata: {
    beehiiv_active?: boolean;
    beehiiv_tier?: string;
    verification_timestamp: string;
  };
  session_token?: string;
  error?: string;
}

// Helper function to determine highest tier
function getHighestTier(tiers: Array<'free' | 'paid' | 'premium'>): 'free' | 'paid' | 'premium' {
  if (tiers.includes('premium')) return 'premium';
  if (tiers.includes('paid')) return 'paid';
  return 'free';
}

// Verify with Beehiiv using direct subscription tier API
async function verifyBeehiiv(email: string): Promise<{ verified: boolean; tier: 'free' | 'paid' | 'premium'; segments: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
      body: { email }
    });

    if (error || !data.success) {
      console.log(`Beehiiv verification failed for ${email}:`, error || data.error);
      return { verified: false, tier: 'free', segments: [] };
    }

    return {
      verified: data.verified,
      tier: data.tier,
      segments: [] // No longer using segments, rely on direct subscription_tier
    };
  } catch (error) {
    console.error('Beehiiv verification error:', error);
    return { verified: false, tier: 'free', segments: [] };
  }
}



// Generate session token
function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Create or get auth user and create secure session using unified identity system
async function createSecureSession(email: string, tier: string, source: string, sessionToken: string): Promise<boolean> {
  try {
    console.log(`🔄 Creating/getting auth user for ${email}`);
    
    let userId: string | null = null;
    
    // Try to create user, but if user already exists, get their ID
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        subscription_tier: tier,
        auth_source: source,
        created_via: 'unified_auth'
      }
    });
    
    if (authError) {
      // If user already exists, that's fine - we'll generate a session for them
      if (authError.message?.includes('already been registered') || authError.status === 422) {
        console.log(`✅ User ${email} already exists, proceeding with session creation`);
        
        // Get the existing user ID by generating a temporary sign-in session
        const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: `https://www.weeklywizdom.com/dashboard`
          }
        });
        
        if (signInError || !signInData.user) {
          console.error('❌ Failed to get existing user ID:', signInError);
          return false;
        }
        
        userId = signInData.user.id;
        console.log(`✅ Found existing auth user for ${email}: ${userId}`);
      } else {
        console.error('❌ Failed to create auth user:', authError);
        return false;
      }
    } else {
      userId = newUser.user?.id || null;
      console.log(`✅ Created new auth user for ${email}: ${userId}`);
    }
    
    if (!userId) {
      console.error('❌ Failed to get user ID');
      return false;
    }

    // Session expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Use the new unified session creation function that handles conflicts properly
    const { data: sessionResult, error: sessionError } = await supabase.rpc('create_unified_session', {
      p_email: email,
      p_session_token: sessionToken,
      p_tier: tier,
      p_source: source,
      p_expires_at: expiresAt.toISOString()
    });

    if (sessionError) {
      console.error('❌ Error creating user session:', sessionError);
      console.log(`❌ Failed to create secure session for ${email}`);
      return false;
    }

    console.log(`✅ Session created successfully:`, sessionResult);
    console.log(`🔐 Created secure session for ${email} with token ${sessionToken.substring(0, 8)}...`);
    return true;
  } catch (error) {
    console.error('❌ Session creation error:', error);
    return false;
  }
}

// Main verification function
async function unifiedVerification(email: string): Promise<VerificationResult> {
  try {
    console.log(`🔍 Starting unified verification for: ${email}`);

    // Verify with Beehiiv
    const beehiivResult = await verifyBeehiiv(email);
    console.log(`🔍 Beehiiv verification result: ${JSON.stringify(beehiivResult)}`);

    // Beehiiv is the sole source of truth
    const beehiivActive = beehiivResult.verified;

    // Determine final tier solely from Beehiiv
    const finalTier = beehiivActive ? beehiivResult.tier : 'free';

    const source: 'beehiiv' | 'none' = beehiivActive ? 'beehiiv' : 'none';
    const verified = beehiivActive;

    
    if (verified && beehiivActive) {
      try {
        // Store/update Beehiiv user in local table for faster future lookups
        const { data: upsertResult, error: upsertError } = await supabase.from('beehiiv_subscribers').upsert({
          email: email,
          subscription_tier: beehiivResult.tier,
          status: 'active',
          metadata: {
            source: 'beehiiv_api_verification',
            verified_at: new Date().toISOString(),
            api_tier: beehiivResult.tier
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        }).select('id').single();
        
        if (upsertError) {
          console.error(`❌ Failed to store Beehiiv user ${email}:`, upsertError);
        } else {
          console.log(`💾 Successfully stored Beehiiv verification for ${email} with tier ${beehiivResult.tier}, ID: ${upsertResult?.id}`);
        }
      } catch (error) {
        console.error('Error storing Beehiiv verification result:', error);
        // Don't fail verification if storage fails
      }
    }

    const metadata = {
      beehiiv_active: beehiivActive,
      beehiiv_tier: beehiivResult.tier,
      verification_timestamp: new Date().toISOString()
    };

    // Generate session token if verified and create secure session
    let sessionToken: string | undefined;
    if (verified) {
      sessionToken = generateSessionToken();
      
      // Create the secure session using email (will create auth user if needed)
      const sessionCreated = await createSecureSession(email, finalTier, source, sessionToken);
      if (sessionCreated) {
        console.log(`🔐 Created secure session for ${email} with token ${sessionToken.substring(0, 8)}...`);
      } else {
        console.error(`❌ Failed to create secure session for ${email}`);
        sessionToken = undefined; // Don't return token if session creation failed
      }
    }

    // Log unified verification (no personal data stored)
    await supabase.from('authentication_audit_log').insert({
      user_email: email,
      auth_method: 'unified_verify',
      action_type: 'unified_verification',
      metadata: {
        ...metadata,
        verified,
        final_tier: finalTier,
        source,
        session_token: sessionToken ? 'generated' : 'none'
      }
    });

    console.log(`✅ Unified verification complete - Email: ${email}, Verified: ${verified}, Tier: ${finalTier}, Source: ${source}`);

    return {
      success: true,
      verified,
      tier: finalTier,
      source,
      metadata,
      session_token: sessionToken
    };

  } catch (error) {
    console.error('Unified verification error:', error);
    return {
      success: false,
      verified: false,
      tier: 'free',
      source: 'none',
      metadata: {
        verification_timestamp: new Date().toISOString()
      },
      error: 'Verification failed'
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action = 'verify' } = await req.json();

    // Enhanced input validation and sanitization
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid email is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (action === 'verify') {
      const result = await unifiedVerification(normalizedEmail);
      
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

  } catch (error) {
    console.error('Request processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false, 
        tier: 'free', 
        source: 'none',
        error: 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});