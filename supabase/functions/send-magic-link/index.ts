import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting cache to prevent duplicate requests
const pendingRequests = new Map();
const rateLimitCache = new Map();

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...corsHeaders },
    ...init,
  });
}

function generateToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startTime = Date.now();
  let email: string;

  try {
    const body = await req.json();
    email = body.email?.toLowerCase().trim();
    
    if (!email) {
      return json({ error: "email is required" }, { status: 400 });
    }

    console.log(`🪄 Magic link request for: ${email}`);

    // Rate limiting - only allow one request per email per 10 seconds
    const now = Date.now();
    const rateLimitKey = `rate_limit_${email}`;
    const lastRequestTime = rateLimitCache.get(rateLimitKey) || 0;
    
    if (now - lastRequestTime < 10000) {
      console.log(`🚫 Rate limited: ${email} - last request was ${now - lastRequestTime}ms ago`);
      return json({ 
        error: 'Please wait before requesting another magic link' 
      }, { status: 429 });
    }
    
    // Check for pending requests for this email
    if (pendingRequests.has(email)) {
      console.log(`🔄 Request already in progress for: ${email}`);
      return json({ 
        error: 'A magic link request is already being processed for this email' 
      }, { status: 409 });
    }
    
    // Mark request as pending
    pendingRequests.set(email, startTime);
    rateLimitCache.set(rateLimitKey, now);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const appUrl = "https://www.weeklywizdom.com";

    const supabase = createClient(supabaseUrl, serviceKey);
    const resend = new Resend(resendApiKey);

    // Use unified auth verification to get proper user tier and create user if needed
    console.log(`🔍 Verifying ${email} with unified auth...`);
    
    const { data: verificationData, error: verifyError } = await supabase.functions.invoke('unified-auth-verify', {
      body: { email: email.toLowerCase() }
    });

    let userTier = 'free';
    let isNewUser = false;

    if (verifyError) {
      console.error('❌ Unified auth verification failed:', verifyError);
      return json({ 
        error: 'Failed to verify your account. Please try again or contact support.' 
      }, { status: 500 });
    }

    if (!verificationData?.success || !verificationData?.verified) {
      // User doesn't exist, auto-enroll them as free subscriber
      console.log(`📝 User not found, creating free subscription...`);
      
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('beehiiv-create-subscription', {
        body: { 
          email: email.toLowerCase(),
          utm_source: 'Weekly Wizdom App',
          utm_medium: 'magic_link_signup',
          utm_campaign: 'auto_enrollment'
        }
      });

      if (subscriptionError || !subscriptionData?.success) {
        console.error('❌ Failed to create Beehiiv subscription:', subscriptionError || subscriptionData?.error);
        return json({ 
          error: 'Failed to create your free subscription. Please try again or contact support.' 
        }, { status: 500 });
      }

      console.log(`✅ Successfully created free subscription for ${email}`);
      userTier = 'free';
      isNewUser = true;
    } else {
      // User exists, use their existing tier from unified verification
      userTier = verificationData.tier || 'free';
      console.log(`✅ Existing user found - Tier: ${userTier}, Source: ${verificationData.source}`);
    }

    // Create token & store in magic_links table
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString(); // 15 min

    const { error: insertErr } = await supabase.from("magic_links").insert({
      email: email,
      token,
      expires_at: expiresAt,
      used: false,
    });
    
    if (insertErr) {
      console.error('❌ Failed to create magic link token:', insertErr);
      throw insertErr;
    }

    // Create magic link URL
    const link = `${appUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send via Resend (plain HTML = no React/Node polyfills)
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px;max-width:560px;margin:0 auto">
        <h1 style="margin:0 0 12px;color:#1a73e8">Weekly Wizdom</h1>
        ${isNewUser ? `
          <h2 style="color:#333; margin:16px 0;">Welcome to Weekly Wizdom! 🎉</h2>
          <p>Thank you for joining our community! We've created your free subscription and you're all set to start receiving valuable crypto insights.</p>
          <p>Click the button below to access your dashboard and explore all the features available to you:</p>
        ` : `
          <h2 style="color:#333; margin:16px 0;">Access Your Account</h2>
          <p>Click the button below to securely access your Weekly Wizdom account:</p>
        `}
        
        <p style="margin:20px 0">
          <a href="${link}" style="display:inline-block;padding:16px 24px;border-radius:8px;background:#1a73e8;color:#fff;text-decoration:none;font-weight:600">
            ${isNewUser ? 'Get Started Now' : 'Sign In to Your Account'}
          </a>
        </p>
        
        <p style="font-size:14px;color:#666">If the button doesn't work, copy and paste this URL:</p>
        <p style="word-break:break-all;font-size:12px;color:#666;background-color:#f8f9fa;padding:12px;border-radius:4px">${link}</p>
        
        ${isNewUser ? `
          <div style="background-color:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;margin:24px 0;padding:20px">
            <p style="margin:8px 0;font-weight:600">What's Next?</p>
            <p style="margin:8px 0;font-size:14px">
              • Access your personalized dashboard<br/>
              • Read our latest newsletter insights<br/>
              • Explore premium features<br/>
              • Join our community discussions
            </p>
          </div>
        ` : ''}
        
        <p style="font-size:12px;color:#666;margin-top:24px">
          This link expires in 15 minutes for security. If you didn't expect this invitation, you can safely ignore this email.
        </p>
        
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
        <p style="color:#6b7280;font-size:12px;text-align:center">
          <a href="https://www.weeklywizdom.com" style="color:#1a73e8;text-decoration:none">Weekly Wizdom</a><br/>
          Your trusted source for crypto insights and trading signals.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "Weekly Wizdom <noreply@weeklywizdom.app>",
      to: [email],
      subject: isNewUser ? 'Welcome to Weekly Wizdom - Your access link' : 'Your Weekly Wizdom access link',
      html,
    });

    console.log(`✅ Magic link sent successfully for ${email}`);

    return json({ 
      success: true, 
      message: isNewUser ? 'Welcome! Access link sent to your email.' : 'Access link sent successfully',
      is_new_user: isNewUser,
      tier: userTier
    });

  } catch (e: any) {
    console.error("send-magic-link error:", e);
    return json({ error: e?.message ?? String(e) }, { status: 500 });
  } finally {
    // Always clean up pending request
    if (email) {
      pendingRequests.delete(email);
    }
  }
});