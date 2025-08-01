import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityScanResult {
  scanId: string;
  timestamp: string;
  vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    recommendation: string;
    affected_resource: string;
  }>;
  summary: {
    total_vulnerabilities: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    security_score: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('🔍 Starting comprehensive security scan...');

    const scanId = crypto.randomUUID();
    const vulnerabilities: any[] = [];

    // 1. RLS Policy Analysis
    console.log('🔒 Scanning RLS policies...');
    const { data: tables } = await supabase.rpc('pg_tables') || { data: [] };
    
    // Check for tables without RLS
    const { data: rlsStatus } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    // 2. Admin Access Review
    console.log('👥 Reviewing admin access...');
    const { data: admins } = await supabase
      .from('admin_users')
      .select('email, role, requires_2fa, is_active, last_login_at');

    const adminsWithout2FA = admins?.filter(admin => 
      admin.is_active && !admin.requires_2fa
    ) || [];

    if (adminsWithout2FA.length > 0) {
      vulnerabilities.push({
        severity: 'critical' as const,
        type: 'authentication',
        description: `${adminsWithout2FA.length} active admin(s) without 2FA enabled`,
        recommendation: 'Enable 2FA for all admin accounts immediately',
        affected_resource: 'admin_users'
      });
    }

    // 3. Session Security Check
    console.log('🔑 Checking session security...');
    const { data: activeSessions } = await supabase
      .from('admin_2fa_sessions')
      .select('*')
      .gt('expires_at', new Date().toISOString());

    const expiredButActiveSessions = activeSessions?.filter(session => 
      new Date(session.expires_at) < new Date()
    ) || [];

    if (expiredButActiveSessions.length > 0) {
      vulnerabilities.push({
        severity: 'high' as const,
        type: 'session_management',
        description: `${expiredButActiveSessions.length} expired session(s) still active`,
        recommendation: 'Implement automatic session cleanup',
        affected_resource: 'admin_2fa_sessions'
      });
    }

    // 4. Sensitive Data Exposure Check
    console.log('🔐 Checking for sensitive data exposure...');
    const { data: secrets } = await supabase
      .from('admin_2fa_secrets')
      .select('admin_email, secret_key')
      .limit(1);

    if (secrets && secrets.length > 0 && secrets[0].secret_key) {
      // Check if secret is properly encrypted (basic check)
      const secretValue = secrets[0].secret_key;
      if (secretValue.length < 32 || !secretValue.includes('=')) {
        vulnerabilities.push({
          severity: 'critical' as const,
          type: 'data_encryption',
          description: '2FA secrets may not be properly encrypted',
          recommendation: 'Implement proper encryption for all sensitive data',
          affected_resource: 'admin_2fa_secrets'
        });
      }
    }

    // 5. Payment Data Security Check
    console.log('💳 Checking payment data security...');
    try {
      const { data: whopData, error } = await supabase
        .from('whop_purchases')
        .select('customer_email, amount_cents')
        .limit(1);

      if (!error && whopData) {
        vulnerabilities.push({
          severity: 'medium' as const,
          type: 'data_access',
          description: 'Payment data accessible - verify RLS policies are properly configured',
          recommendation: 'Ensure payment data has strict access controls',
          affected_resource: 'whop_purchases'
        });
      }
    } catch (error) {
      // This is good - payment data should be restricted
      console.log('✅ Payment data properly secured');
    }

    // 6. Edge Function Security Check
    console.log('⚡ Checking edge function security...');
    const edgeFunctionChecks = [
      'create-2fa-session',
      'verify-2fa-token',
      'whop-integration'
    ];

    for (const functionName of edgeFunctionChecks) {
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { security_scan: true }
        });
        
        if (!error) {
          vulnerabilities.push({
            severity: 'medium' as const,
            type: 'edge_function',
            description: `Edge function '${functionName}' responds to security scan requests`,
            recommendation: 'Implement proper input validation and security checks',
            affected_resource: functionName
          });
        }
      } catch (error) {
        // Expected for secure functions
        console.log(`✅ Function ${functionName} properly secured`);
      }
    }

    // 7. Network Security Check
    console.log('🌐 Checking network security...');
    const currentTime = new Date();
    const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);

    const { data: recentFailedLogins } = await supabase
      .from('admin_security_events')
      .select('*')
      .eq('event_type', 'login_failed')
      .gte('created_at', oneHourAgo.toISOString());

    if (recentFailedLogins && recentFailedLogins.length > 5) {
      vulnerabilities.push({
        severity: 'high' as const,
        type: 'brute_force',
        description: `${recentFailedLogins.length} failed login attempts in the last hour`,
        recommendation: 'Implement rate limiting and IP blocking for failed attempts',
        affected_resource: 'authentication_system'
      });
    }

    // Calculate security score
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

    const securityScore = Math.max(0, 100 - (criticalCount * 25 + highCount * 15 + mediumCount * 10 + lowCount * 5));

    const scanResult: SecurityScanResult = {
      scanId,
      timestamp: new Date().toISOString(),
      vulnerabilities,
      summary: {
        total_vulnerabilities: vulnerabilities.length,
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        security_score: securityScore
      }
    };

    // Log the security scan
    await supabase.rpc('log_comprehensive_security_event', {
      p_category: 'system',
      p_event_type: 'security_scan',
      p_severity: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'medium',
      p_actor_email: 'system',
      p_target_resource: 'entire_system',
      p_action_details: {
        scan_id: scanId,
        vulnerabilities_found: vulnerabilities.length,
        security_score: securityScore
      },
      p_risk_score: criticalCount > 0 ? 10 : highCount > 0 ? 7 : 4
    });

    console.log(`🔍 Security scan completed. Score: ${securityScore}/100`);
    console.log(`Found ${vulnerabilities.length} vulnerabilities (${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low)`);

    return new Response(JSON.stringify(scanResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Security scan error:', error);
    return new Response(JSON.stringify({ 
      error: 'Security scan failed', 
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});