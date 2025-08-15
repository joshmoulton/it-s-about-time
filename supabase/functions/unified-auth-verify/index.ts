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
  error?: string;
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
      segments: []
    };
  } catch (error) {
    console.error('Beehiiv verification error:', error);
    return { verified: false, tier: 'free', segments: [] };
  }
}

// Main verification function - NO SESSION CREATION
async function unifiedVerification(email: string): Promise<VerificationResult> {
  try {
    console.log(`🔍 Starting unified verification for: ${email}`);

    // Verify with Beehiiv
    const beehiivResult = await verifyBeehiiv(email);
    console.log(`🔍 Beehiiv verification result: ${JSON.stringify(beehiivResult)}`);

    const beehiivActive = beehiivResult.verified;
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
      }
    }

    const metadata = {
      beehiiv_active: beehiivActive,
      beehiiv_tier: beehiivResult.tier,
      verification_timestamp: new Date().toISOString()
    };

    // Log unified verification (no personal data stored)
    await supabase.from('authentication_audit_log').insert({
      user_email: email,
      auth_method: 'unified_verify',
      action_type: 'unified_verification',
      metadata: {
        ...metadata,
        verified,
        final_tier: finalTier,
        source
      }
    });

    console.log(`✅ Unified verification complete - Email: ${email}, Verified: ${verified}, Tier: ${finalTier}, Source: ${source}`);

    return {
      success: true,
      verified,
      tier: finalTier,
      source,
      metadata
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