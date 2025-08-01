-- Fix search_path issues for security functions to resolve Supabase performance warnings

-- Fix cleanup_expired_admin_sessions function
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.admin_2fa_sessions 
  WHERE expires_at < now() OR created_at < now() - INTERVAL '2 hours';
END;
$$;

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_actor_email text DEFAULT NULL,
  p_target_resource text DEFAULT NULL,
  p_action_details jsonb DEFAULT '{}'::jsonb,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_risk_score numeric DEFAULT 0.0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_trail (
    event_type,
    event_category,
    actor_email,
    target_resource,
    action_details,
    ip_address,
    user_agent,
    risk_score,
    severity_level,
    created_at
  ) VALUES (
    p_event_type,
    'security',
    COALESCE(p_actor_email, get_current_user_email()),
    p_target_resource,
    p_action_details,
    p_ip_address,
    p_user_agent,
    p_risk_score,
    CASE 
      WHEN p_risk_score >= 8.0 THEN 'critical'
      WHEN p_risk_score >= 6.0 THEN 'high'
      WHEN p_risk_score >= 4.0 THEN 'medium'
      ELSE 'low'
    END,
    now()
  );
END;
$$;

-- Fix encrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
  p_user_id uuid,
  p_data_type text,
  p_raw_value text,
  p_classification data_classification DEFAULT 'confidential'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encrypted_value text;
  key_id text := 'default';
  record_id uuid;
BEGIN
  -- Simple encryption for demo (in production, use proper encryption)
  encrypted_value := encode(
    encrypt(
      p_raw_value::bytea,
      ('encryption_key_' || key_id)::bytea,
      'aes'
    ),
    'base64'
  );
  
  INSERT INTO public.encrypted_user_data (
    user_id,
    data_type,
    encrypted_value,
    encryption_key_id,
    classification
  ) VALUES (
    p_user_id,
    p_data_type,
    encrypted_value,
    key_id,
    p_classification
  ) RETURNING id INTO record_id;
  
  RETURN record_id;
END;
$$;

-- Fix log_comprehensive_security_event function
CREATE OR REPLACE FUNCTION public.log_comprehensive_security_event(
  p_event_type text,
  p_severity text DEFAULT 'medium',
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_email text;
  risk_score numeric := 0.0;
BEGIN
  current_email := get_current_user_email();
  
  -- Calculate risk score based on event type
  risk_score := CASE p_event_type
    WHEN 'unauthorized_access_attempt' THEN 8.0
    WHEN 'privilege_escalation' THEN 9.0
    WHEN 'data_breach_attempt' THEN 9.5
    WHEN 'suspicious_login' THEN 6.0
    WHEN 'failed_2fa' THEN 4.0
    ELSE 2.0
  END;
  
  INSERT INTO public.security_audit_trail (
    event_type,
    event_category,
    actor_email,
    severity_level,
    action_details,
    risk_score,
    created_at
  ) VALUES (
    p_event_type,
    'comprehensive_security',
    current_email,
    p_severity,
    p_details,
    risk_score,
    now()
  );
END;
$$;

-- Fix revoke_suspicious_sessions function
CREATE OR REPLACE FUNCTION public.revoke_suspicious_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  revoked_count integer := 0;
BEGIN
  -- Revoke sessions with multiple failed attempts
  UPDATE public.admin_2fa_sessions 
  SET 
    expires_at = now(),
    verified_at = NULL
  WHERE admin_email IN (
    SELECT admin_email 
    FROM public.admin_security_events 
    WHERE event_type = 'login_failed' 
      AND created_at > now() - INTERVAL '1 hour'
    GROUP BY admin_email 
    HAVING COUNT(*) >= 5
  )
  AND expires_at > now();
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  -- Log the action
  PERFORM log_security_event(
    'suspicious_sessions_revoked',
    'system',
    'admin_sessions',
    jsonb_build_object('revoked_count', revoked_count),
    NULL,
    NULL,
    CASE WHEN revoked_count > 0 THEN 7.0 ELSE 2.0 END
  );
  
  RETURN revoked_count;
END;
$$;

-- Fix conduct_access_review function
CREATE OR REPLACE FUNCTION public.conduct_access_review()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  review_results jsonb := '{}'::jsonb;
  inactive_admins integer;
  expired_sessions integer;
  stale_devices integer;
BEGIN
  -- Count inactive admins (no login in 30 days)
  SELECT COUNT(*) INTO inactive_admins
  FROM public.admin_users
  WHERE is_active = true
    AND (last_login_at IS NULL OR last_login_at < now() - INTERVAL '30 days');
  
  -- Count expired sessions that should be cleaned up
  SELECT COUNT(*) INTO expired_sessions
  FROM public.admin_2fa_sessions
  WHERE expires_at < now();
  
  -- Count stale device authorizations (not used in 60 days)
  SELECT COUNT(*) INTO stale_devices
  FROM public.admin_device_auth
  WHERE is_trusted = true
    AND (last_used_at IS NULL OR last_used_at < now() - INTERVAL '60 days');
  
  -- Build review results
  review_results := jsonb_build_object(
    'review_date', now(),
    'inactive_admins', inactive_admins,
    'expired_sessions', expired_sessions,
    'stale_devices', stale_devices,
    'recommendations', CASE
      WHEN inactive_admins > 0 OR stale_devices > 0 THEN 
        jsonb_build_array(
          'Review inactive admin accounts',
          'Clean up stale device authorizations',
          'Enforce regular access reviews'
        )
      ELSE jsonb_build_array('No immediate action required')
    END
  );
  
  -- Log the review
  PERFORM log_security_event(
    'access_review_completed',
    'system',
    'admin_access',
    review_results,
    NULL,
    NULL,
    CASE WHEN inactive_admins > 0 OR stale_devices > 0 THEN 5.0 ELSE 1.0 END
  );
  
  RETURN review_results;
END;
$$;

-- Fix monitor_security_anomalies function
CREATE OR REPLACE FUNCTION public.monitor_security_anomalies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  anomalies jsonb := '[]'::jsonb;
  failed_logins integer;
  suspicious_ips integer;
  anomaly_report jsonb;
BEGIN
  -- Check for excessive failed logins in the last hour
  SELECT COUNT(*) INTO failed_logins
  FROM public.admin_security_events
  WHERE event_type = 'login_failed'
    AND created_at > now() - INTERVAL '1 hour';
  
  -- Check for suspicious IP patterns
  SELECT COUNT(DISTINCT ip_address) INTO suspicious_ips
  FROM public.admin_security_events
  WHERE event_type = 'login_failed'
    AND created_at > now() - INTERVAL '1 hour'
    AND ip_address IS NOT NULL;
  
  -- Build anomaly report
  IF failed_logins > 10 THEN
    anomalies := anomalies || jsonb_build_object(
      'type', 'excessive_failed_logins',
      'count', failed_logins,
      'severity', 'high',
      'description', 'Unusual number of failed login attempts detected'
    );
  END IF;
  
  IF suspicious_ips > 5 THEN
    anomalies := anomalies || jsonb_build_object(
      'type', 'multiple_ip_failures',
      'count', suspicious_ips,
      'severity', 'medium',
      'description', 'Failed logins from multiple IP addresses'
    );
  END IF;
  
  anomaly_report := jsonb_build_object(
    'scan_time', now(),
    'anomalies_detected', jsonb_array_length(anomalies),
    'anomalies', anomalies,
    'status', CASE 
      WHEN jsonb_array_length(anomalies) > 0 THEN 'anomalies_found'
      ELSE 'normal'
    END
  );
  
  -- Log monitoring results
  PERFORM log_security_event(
    'security_monitoring_completed',
    'system',
    'security_monitoring',
    anomaly_report,
    NULL,
    NULL,
    CASE WHEN jsonb_array_length(anomalies) > 0 THEN 6.0 ELSE 1.0 END
  );
  
  RETURN anomaly_report;
END;
$$;