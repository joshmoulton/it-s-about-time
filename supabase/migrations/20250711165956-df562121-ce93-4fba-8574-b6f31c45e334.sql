-- AUTOMATED SECURITY MONITORING: Set up cron jobs for continuous security monitoring (Fixed)

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule security monitoring to run every 15 minutes
SELECT cron.schedule(
  'security-monitoring-15min',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/security-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTM5NTAsImV4cCI6MjA2NTQyOTk1MH0.iR1E5RqVrH7OsDdIqDvMWsc5d2jK9Qg9Ck-2lpi3E2g"}'::jsonb,
        body:='{"automated": true, "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule comprehensive security scan to run daily at 2 AM
SELECT cron.schedule(
  'daily-security-scan',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/security-scanner',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTM5NTAsImV4cCI6MjA2NTQyOTk1MH0.iR1E5RqVrH7OsDdIqDvMWsc5d2jK9Qg9Ck-2lpi3E2g"}'::jsonb,
        body:='{"scheduled_scan": true, "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule session cleanup to run every hour
SELECT cron.schedule(
  'hourly-session-cleanup',
  '0 * * * *', -- Every hour
  $$
  SELECT public.cleanup_expired_admin_sessions();
  $$
);

-- Schedule access review to run weekly on Sundays at 1 AM
SELECT cron.schedule(
  'weekly-access-review',
  '0 1 * * 0', -- Every Sunday at 1 AM
  $$
  SELECT public.conduct_access_review();
  $$
);

-- Schedule automated backup to run daily at 3 AM
SELECT cron.schedule(
  'daily-secure-backup',
  '0 3 * * *', -- Every day at 3 AM
  $$
  SELECT
    net.http_post(
        url:='https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/secure-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.lh24B3_u6TrhTPGcm9EakjHfpX2Y6LX8RDjJzJYtyXw"}'::jsonb,
        body:='{"includeUserData": true, "includeSecurityLogs": true, "includeSensitiveData": false, "encryptionLevel": "high", "retentionDays": 30}'::jsonb
    ) as request_id;
  $$
);

-- Create a security dashboard function instead of view
CREATE OR REPLACE FUNCTION public.get_security_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dashboard_metrics JSONB;
BEGIN
  -- Check if user is super admin
  IF NOT has_admin_role('super_admin') THEN
    RETURN '{"error": "Access denied - super admin required"}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    'timestamp', now(),
    'active_admins', (SELECT COUNT(*) FROM admin_users WHERE is_active = true),
    'admins_without_2fa', (SELECT COUNT(*) FROM admin_users WHERE is_active = true AND requires_2fa = false),
    'active_sessions', (SELECT COUNT(*) FROM admin_2fa_sessions WHERE expires_at > now()),
    'failed_logins_last_hour', (
      SELECT COUNT(*) FROM admin_security_events 
      WHERE event_type = 'login_failed' AND created_at > now() - INTERVAL '1 hour'
    ),
    'security_events_today', (
      SELECT COUNT(*) FROM security_audit_trail 
      WHERE created_at > current_date
    ),
    'high_risk_events_today', (
      SELECT COUNT(*) FROM security_audit_trail 
      WHERE created_at > current_date AND risk_score > 7
    ),
    'last_backup', (
      SELECT completed_at FROM backup_history 
      WHERE status = 'completed' 
      ORDER BY completed_at DESC LIMIT 1
    ),
    'system_health_score', CASE 
      WHEN (SELECT COUNT(*) FROM admin_users WHERE is_active = true AND requires_2fa = false) > 0 THEN 'CRITICAL'
      WHEN (SELECT COUNT(*) FROM admin_security_events WHERE event_type = 'login_failed' AND created_at > now() - INTERVAL '1 hour') > 5 THEN 'HIGH_RISK'
      ELSE 'HEALTHY'
    END
  ) INTO dashboard_metrics;

  RETURN dashboard_metrics;
END;
$$;

-- Log the automated security setup
INSERT INTO public.admin_audit_log (
  action,
  resource,
  user_email,
  metadata
) VALUES (
  'automated_security_setup',
  'system_wide',
  'system',
  jsonb_build_object(
    'phase', 'automated_monitoring_and_backup',
    'timestamp', now(),
    'scheduled_jobs', jsonb_build_array(
      'security_monitoring_15min',
      'daily_security_scan',
      'hourly_session_cleanup',
      'weekly_access_review',
      'daily_secure_backup'
    ),
    'security_functions_deployed', jsonb_build_array(
      'security-scanner',
      'secure-backup',
      'security-monitor'
    )
  )
);