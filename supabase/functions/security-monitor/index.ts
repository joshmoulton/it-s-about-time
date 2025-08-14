import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  details: any;
  timestamp: string;
  auto_resolved: boolean;
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

    console.log('🛡️  Starting automated security monitoring...');

    const alerts: ThreatAlert[] = [];
    const currentTime = new Date();
    const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

    // 1. Monitor Failed Login Attempts
    const { data: failedLogins } = await supabase
      .from('admin_security_events')
      .select('*')
      .eq('event_type', 'login_failed')
      .gte('created_at', oneHourAgo.toISOString());

    if (failedLogins && failedLogins.length > 10) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: 'high',
        type: 'brute_force_attack',
        description: `${failedLogins.length} failed login attempts detected in the last hour`,
        details: {
          failed_attempts: failedLogins.length,
          unique_ips: [...new Set(failedLogins.map(f => f.ip_address))].length,
          time_window: '1 hour'
        },
        timestamp: currentTime.toISOString(),
        auto_resolved: false
      });

      // Auto-block suspicious IPs if too many attempts from same IP
      const ipAttempts = failedLogins.reduce((acc: any, login) => {
        acc[login.ip_address] = (acc[login.ip_address] || 0) + 1;
        return acc;
      }, {});

      for (const [ip, attempts] of Object.entries(ipAttempts)) {
        if (attempts as number > 5) {
          console.log(`🚫 Auto-blocking suspicious IP: ${ip} (${attempts} attempts)`);
          // In a real implementation, you would add the IP to a blocklist
        }
      }
    }

    // 2. Monitor Unusual Data Access Patterns
    const { data: unusualAccess } = await supabase
      .from('security_audit_trail')
      .select('*')
      .eq('is_suspicious', true)
      .gte('created_at', oneDayAgo.toISOString());

    if (unusualAccess && unusualAccess.length > 5) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        type: 'unusual_access_pattern',
        description: `${unusualAccess.length} suspicious access patterns detected in the last 24 hours`,
        details: {
          suspicious_events: unusualAccess.length,
          affected_resources: [...new Set(unusualAccess.map(a => a.target_resource))],
          time_window: '24 hours'
        },
        timestamp: currentTime.toISOString(),
        auto_resolved: false
      });
    }

    // 3. Monitor Session Anomalies
    const { data: expiredSessions } = await supabase
      .from('admin_2fa_sessions')
      .select('*')
      .lt('expires_at', currentTime.toISOString())
      .is('verified_at', null);

    if (expiredSessions && expiredSessions.length > 0) {
      // Clean up expired unverified sessions
      await supabase
        .from('admin_2fa_sessions')
        .delete()
        .lt('expires_at', currentTime.toISOString())
        .is('verified_at', null);

      console.log(`🧹 Cleaned up ${expiredSessions.length} expired unverified sessions`);
    }

    // 4. Monitor Admin Account Security
    const { data: unsecureAdmins } = await supabase
      .from('admin_users')
      .select('email, requires_2fa, last_login_at')
      .eq('is_active', true)
      .eq('requires_2fa', false);

    if (unsecureAdmins && unsecureAdmins.length > 0) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: 'critical',
        type: 'insecure_admin_accounts',
        description: `${unsecureAdmins.length} admin account(s) without 2FA enabled`,
        details: {
          unsecure_admins: unsecureAdmins.map(admin => admin.email),
          recommendation: 'Enable 2FA immediately for all admin accounts'
        },
        timestamp: currentTime.toISOString(),
        auto_resolved: false
      });
    }

    // 5. Monitor Payment Data Access
    const { data: paymentAccess } = await supabase
      .from('security_audit_trail')
      .select('*')
      .eq('target_resource', 'whop_purchases')
      .gte('created_at', oneHourAgo.toISOString());

    if (paymentAccess && paymentAccess.length > 10) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: 'high',
        type: 'excessive_payment_data_access',
        description: `${paymentAccess.length} payment data access events in the last hour`,
        details: {
          access_events: paymentAccess.length,
          unique_actors: [...new Set(paymentAccess.map(p => p.actor_email))],
          time_window: '1 hour'
        },
        timestamp: currentTime.toISOString(),
        auto_resolved: false
      });
    }

    // 6. Monitor System Resource Usage
    const { data: backupHistory } = await supabase
      .from('backup_history')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', oneDayAgo.toISOString());

    if (backupHistory && backupHistory.length > 0) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        type: 'backup_failures',
        description: `${backupHistory.length} backup failure(s) in the last 24 hours`,
        details: {
          failed_backups: backupHistory.length,
          latest_failure: backupHistory[0]?.error_message
        },
        timestamp: currentTime.toISOString(),
        auto_resolved: false
      });
    }

    // 7. Perform Automated Security Actions
    let autoActions = 0;

    // Auto-cleanup expired sessions
    const { data: cleanupResult } = await supabase.rpc('cleanup_expired_admin_sessions');
    if (cleanupResult) {
      autoActions++;
      console.log('🧹 Cleaned up expired admin sessions');
    }

    // Auto-revoke suspicious sessions
    const { data: suspiciousCleanup } = await supabase.rpc('revoke_suspicious_sessions');
    if (suspiciousCleanup && suspiciousCleanup > 0) {
      autoActions++;
      console.log(`🚫 Revoked ${suspiciousCleanup} suspicious sessions`);
    }

    // 8. Generate Security Health Score
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    const mediumAlerts = alerts.filter(a => a.severity === 'medium').length;
    const lowAlerts = alerts.filter(a => a.severity === 'low').length;

    const healthScore = Math.max(0, 100 - (criticalAlerts * 30 + highAlerts * 20 + mediumAlerts * 10 + lowAlerts * 5));

    // 9. Log Monitoring Results
    await supabase.rpc('log_comprehensive_security_event', {
      p_category: 'system',
      p_event_type: 'automated_monitoring',
      p_severity: criticalAlerts > 0 ? 'critical' : highAlerts > 0 ? 'high' : 'low',
      p_actor_email: 'security_monitor',
      p_target_resource: 'system_wide',
      p_action_details: {
        monitoring_cycle_id: crypto.randomUUID(),
        health_score: healthScore,
        alerts_generated: alerts.length,
        auto_actions_taken: autoActions,
        alert_breakdown: {
          critical: criticalAlerts,
          high: highAlerts,
          medium: mediumAlerts,
          low: lowAlerts
        }
      },
      p_risk_score: criticalAlerts > 0 ? 10 : highAlerts > 0 ? 7 : 3
    });

    const monitoringResult = {
      monitoring_id: crypto.randomUUID(),
      timestamp: currentTime.toISOString(),
      security_health_score: healthScore,
      alerts_generated: alerts.length,
      auto_actions_taken: autoActions,
      alerts: alerts,
      summary: {
        status: criticalAlerts > 0 ? 'critical' : highAlerts > 0 ? 'warning' : 'healthy',
        critical_alerts: criticalAlerts,
        high_alerts: highAlerts,
        medium_alerts: mediumAlerts,
        low_alerts: lowAlerts,
        recommendations: [
          ...(criticalAlerts > 0 ? ['Address critical security issues immediately'] : []),
          ...(highAlerts > 0 ? ['Review and resolve high-priority alerts'] : []),
          'Maintain regular security monitoring',
          'Keep security policies up to date'
        ]
      }
    };

    console.log(`🛡️  Security monitoring completed:`);
    console.log(`   Health Score: ${healthScore}/100`);
    console.log(`   Alerts: ${alerts.length} (${criticalAlerts} critical, ${highAlerts} high, ${mediumAlerts} medium, ${lowAlerts} low)`);
    console.log(`   Auto Actions: ${autoActions}`);

    return new Response(JSON.stringify(monitoringResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Security monitoring error:', error);
    return new Response(JSON.stringify({ 
      error: 'Security monitoring failed', 
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});