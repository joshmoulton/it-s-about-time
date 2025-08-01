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
  source: 'beehiiv' | 'whop' | 'both' | 'none';
  metadata: {
    beehiiv_active?: boolean;
    whop_active?: boolean;
    beehiiv_tier?: string;
    whop_tier?: string;
    beehiiv_segments?: string[];
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

// Verify with Beehiiv using segment-based checking
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
      segments: data.segments || []
    };
  } catch (error) {
    console.error('Beehiiv verification error:', error);
    return { verified: false, tier: 'free', segments: [] };
  }
}

// Verify with Whop - enhanced with product-specific verification
async function verifyWhop(email: string): Promise<{ verified: boolean; tier: 'free' | 'paid' | 'premium' }> {
  try {
    const { data, error } = await supabase
      .from('whop_authenticated_users')
      .select('user_email, subscription_tier, metadata, last_verified_at, whop_purchase_id')
      .eq('user_email', email)
      .single();

    if (error || !data) {
      console.log(`Whop verification failed for ${email}:`, error?.message);
      return { verified: false, tier: 'free' };
    }

    // Enhanced verification - check if the user has Weekly Wizdom subscriptions
    const subscriptionTier = data.subscription_tier || 'free';
    const hasWeeklyWizdomSubscription = data.whop_purchase_id && 
                                       data.whop_purchase_id !== 'no_weekly_wizdom_subscription' &&
                                       data.whop_purchase_id !== 'free_access';

    // Check if verification is recent (within last 24 hours)
    const lastVerified = new Date(data.last_verified_at);
    const isRecentlyVerified = (Date.now() - lastVerified.getTime()) < 24 * 60 * 60 * 1000;

    console.log(`🔍 Whop verification for ${email}:`, {
      tier: subscriptionTier,
      hasWeeklyWizdomSubscription,
      isRecentlyVerified,
      purchaseId: data.whop_purchase_id,
      lastVerified: data.last_verified_at
    });

    return {
      verified: true,
      tier: subscriptionTier
    };
  } catch (error) {
    console.error('Whop verification error:', error);
    return { verified: false, tier: 'free' };
  }
}

// Generate session token
function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Create or get auth user and create secure session
async function createSecureSession(email: string, tier: string, source: string, sessionToken: string): Promise<boolean> {
  try {
    // First, try to find existing auth user
    let userId: string | null = null;
    
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      userId = existingUser.id;
      console.log(`🔍 Found existing auth user for ${email}: ${userId}`);
    } else {
      // Create auth user if doesn't exist
      console.log(`🔄 Creating auth user for ${email}`);
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
        console.error('❌ Failed to create auth user:', authError);
        return false;
      }
      
      userId = newUser.user?.id || null;
      console.log(`✅ Created auth user for ${email}: ${userId}`);
    }
    
    if (!userId) {
      console.error('❌ Failed to get user ID');
      return false;
    }

    // Session expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        session_token: sessionToken,
        tier,
        source,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Error creating user session:', error);
      return false;
    }

    console.log(`✅ Session created successfully for user ${userId}`);
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

    // Run both verifications in parallel
    const [beehiivResult, whopResult] = await Promise.all([
      verifyBeehiiv(email),
      verifyWhop(email)
    ]);

    console.log(`🔍 Verification results - Beehiiv: ${JSON.stringify(beehiivResult)}, Whop: ${JSON.stringify(whopResult)}`);

    // Determine verification status and source
    const beehiivActive = beehiivResult.verified;
    const whopActive = whopResult.verified;
    
    let source: 'beehiiv' | 'whop' | 'both' | 'none' = 'none';
    let verified = false;
    
    if (beehiivActive && whopActive) {
      source = 'both';
      verified = true;
    } else if (beehiivActive) {
      source = 'beehiiv';
      verified = true;
    } else if (whopActive) {
      source = 'whop';
      verified = true;
    }

    // Determine final tier (highest available)
    const tiers: Array<'free' | 'paid' | 'premium'> = [];
    if (beehiivActive) tiers.push(beehiivResult.tier);
    if (whopActive) tiers.push(whopResult.tier);
    
    const finalTier = tiers.length > 0 ? getHighestTier(tiers) : 'free';

    // **CRITICAL FIX**: Store successful verification results locally and create session
    let subscriberId: string | null = null;
    
    if (verified && beehiivActive) {
      try {
        // Store/update Beehiiv user in local table for faster future lookups
        const { data: upsertResult, error: upsertError } = await supabase.from('beehiiv_subscribers').upsert({
          email: email,
          subscription_tier: beehiivResult.tier,
          status: 'active',
          metadata: {
            source: 'external_verification',
            segments: beehiivResult.segments,
            verified_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        }).select('id').single();
        
        if (upsertError) {
          console.error(`❌ Failed to store Beehiiv user ${email}:`, upsertError);
        } else {
          subscriberId = upsertResult?.id;
          console.log(`💾 Successfully stored Beehiiv verification for ${email} with tier ${beehiivResult.tier}, ID: ${subscriberId}`);
        }
      } catch (error) {
        console.error('Error storing Beehiiv verification result:', error);
        // Don't fail verification if storage fails
      }
    }

    // For Whop users, get existing subscriber ID or create a new record
    if (verified && whopActive && !subscriberId) {
      try {
        // First try to find existing subscriber
        const { data: existingUser } = await supabase
          .from('beehiiv_subscribers')
          .select('id')
          .eq('email', email)
          .single();
        
        if (existingUser) {
          subscriberId = existingUser.id;
          console.log(`🔍 Found existing subscriber ID for Whop user ${email}: ${subscriberId}`);
        } else {
          // Create new subscriber record for Whop user
          const { data: newSubscriber, error: createError } = await supabase
            .from('beehiiv_subscribers')
            .insert({
              email: email,
              subscription_tier: whopResult.tier,
              status: 'active',
              metadata: {
                source: 'whop_verification',
                verified_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (createError) {
            console.error(`❌ Failed to create subscriber record for Whop user ${email}:`, createError);
          } else {
            subscriberId = newSubscriber.id;
            console.log(`💾 Created new subscriber record for Whop user ${email} with ID: ${subscriberId}`);
          }
        }
      } catch (error) {
        console.error(`Error handling subscriber record for Whop user ${email}:`, error);
      }
    }

    const metadata = {
      beehiiv_active: beehiivActive,
      whop_active: whopActive,
      beehiiv_tier: beehiivResult.tier,
      whop_tier: whopResult.tier,
      beehiiv_segments: beehiivResult.segments,
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

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
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