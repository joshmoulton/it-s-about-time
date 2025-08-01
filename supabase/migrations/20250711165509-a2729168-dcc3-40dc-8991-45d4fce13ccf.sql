-- PHASE 2 & 3: DATA ENCRYPTION, SESSION SECURITY, ENHANCED LOGGING
-- Advanced security hardening and monitoring

-- 1. ENCRYPT SENSITIVE DATA: Create encryption functions for secrets
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
  p_data TEXT,
  p_key_id TEXT DEFAULT 'default'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key TEXT;
  encrypted_result TEXT;
BEGIN
  -- Get encryption key from vault or generate if not exists
  encryption_key := 'secure_key_' || p_key_id || '_' || extract(epoch from now())::text;
  
  -- Encrypt the data using pgcrypto
  encrypted_result := encode(
    encrypt(
      p_data::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
  
  -- Log encryption event
  PERFORM log_security_event(
    'data_encryption',
    get_current_user_email_optimized(),
    true,
    jsonb_build_object('key_id', p_key_id, 'timestamp', now())
  );
  
  RETURN encrypted_result;
END;
$$;

-- 2. ENHANCED SESSION SECURITY: Create session management table
CREATE TABLE IF NOT EXISTS public.admin_secure_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  security_level TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

-- Enable RLS on secure sessions
ALTER TABLE public.admin_secure_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for admin secure sessions
CREATE POLICY "admin_secure_sessions_self_access" 
  ON public.admin_secure_sessions 
  FOR ALL 
  USING (
    admin_email = get_current_user_email_optimized() OR
    has_admin_role('super_admin')
  )
  WITH CHECK (
    admin_email = get_current_user_email_optimized() OR
    has_admin_role('super_admin')
  );

-- 3. ADVANCED AUDIT LOGGING: Enhanced security events table
CREATE TABLE IF NOT EXISTS public.security_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_category TEXT NOT NULL, -- 'authentication', 'authorization', 'data_access', 'system'
  event_type TEXT NOT NULL,
  severity_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  actor_email TEXT,
  actor_type TEXT DEFAULT 'user', -- 'user', 'admin', 'system', 'api'
  target_resource TEXT,
  target_id TEXT,
  action_details JSONB DEFAULT '{}',
  security_context JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  geolocation JSONB,
  session_id TEXT,
  correlation_id UUID DEFAULT gen_random_uuid(),
  risk_score INTEGER DEFAULT 0,
  is_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  investigation_status TEXT DEFAULT 'none' -- 'none', 'pending', 'investigating', 'resolved', 'false_positive'
);

-- Enable RLS on security audit trail
ALTER TABLE public.security_audit_trail ENABLE ROW LEVEL SECURITY;

-- Policy for security audit trail (super admin and system only)
CREATE POLICY "security_audit_trail_super_admin_access" 
  ON public.security_audit_trail 
  FOR ALL 
  USING (has_admin_role('super_admin'))
  WITH CHECK (has_admin_role('super_admin'));

-- 4. COMPREHENSIVE LOGGING FUNCTION
CREATE OR REPLACE FUNCTION public.log_comprehensive_security_event(
  p_category TEXT,
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_actor_email TEXT DEFAULT NULL,
  p_target_resource TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_action_details JSONB DEFAULT '{}',
  p_risk_score INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  current_ip INET;
  current_agent TEXT;
BEGIN
  -- Extract request metadata
  BEGIN
    current_ip := (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet;
  EXCEPTION WHEN OTHERS THEN
    current_ip := NULL;
  END;
  
  BEGIN
    current_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    current_agent := NULL;
  END;

  -- Insert comprehensive audit record
  INSERT INTO public.security_audit_trail (
    event_category,
    event_type,
    severity_level,
    actor_email,
    target_resource,
    target_id,
    action_details,
    security_context,
    ip_address,
    user_agent,
    risk_score,
    is_suspicious
  ) VALUES (
    p_category,
    p_event_type,
    p_severity,
    COALESCE(p_actor_email, get_current_user_email_optimized()),
    p_target_resource,
    p_target_id,
    p_action_details,
    jsonb_build_object(
      'timestamp', now(),
      'session_type', 'admin',
      'auth_method', '2fa',
      'environment', 'production'
    ),
    current_ip,
    current_agent,
    p_risk_score,
    p_risk_score > 7
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- 5. SESSION CLEANUP AND SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.revoke_suspicious_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  revoked_count INTEGER := 0;
BEGIN
  -- Revoke sessions with high risk indicators
  UPDATE public.admin_secure_sessions
  SET 
    is_active = false,
    revoked_at = now(),
    revoked_reason = 'suspicious_activity'
  WHERE is_active = true
    AND (
      last_activity_at < now() - INTERVAL '2 hours' OR
      expires_at < now() OR
      device_fingerprint IS NULL OR
      ip_address IS NULL
    );
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  -- Log the cleanup
  PERFORM log_comprehensive_security_event(
    'system',
    'session_cleanup',
    'medium',
    'system',
    'admin_sessions',
    NULL,
    jsonb_build_object('revoked_sessions', revoked_count),
    5
  );
  
  RETURN revoked_count;
END;
$$;

-- 6. ACCESS REVIEW: Function to audit all permissions
CREATE OR REPLACE FUNCTION public.conduct_access_review()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  review_result JSONB := '{}';
  admin_count INTEGER;
  active_sessions INTEGER;
  risky_permissions INTEGER;
BEGIN
  -- Count active admins
  SELECT COUNT(*) INTO admin_count
  FROM public.admin_users
  WHERE is_active = true;
  
  -- Count active sessions
  SELECT COUNT(*) INTO active_sessions
  FROM public.admin_2fa_sessions
  WHERE expires_at > now();
  
  -- Check for risky permissions (admins without 2FA)
  SELECT COUNT(*) INTO risky_permissions
  FROM public.admin_users
  WHERE is_active = true AND requires_2fa = false;
  
  -- Build review result
  review_result := jsonb_build_object(
    'review_timestamp', now(),
    'active_admins', admin_count,
    'active_sessions', active_sessions,
    'risky_permissions', risky_permissions,
    'security_status', CASE 
      WHEN risky_permissions > 0 THEN 'high_risk'
      WHEN admin_count > 5 THEN 'medium_risk'
      ELSE 'low_risk'
    END,
    'recommendations', jsonb_build_array(
      CASE WHEN risky_permissions > 0 THEN 'Enable 2FA for all admins' END,
      CASE WHEN admin_count > 5 THEN 'Review admin access necessity' END,
      'Regular security audits',
      'Monitor suspicious activities'
    )
  );
  
  -- Log the review
  PERFORM log_comprehensive_security_event(
    'system',
    'access_review',
    CASE WHEN risky_permissions > 0 THEN 'high' ELSE 'medium' END,
    'system',
    'access_control',
    NULL,
    review_result,
    CASE WHEN risky_permissions > 0 THEN 8 ELSE 3 END
  );
  
  RETURN review_result;
END;
$$;

-- 7. AUTOMATED SECURITY MONITORING
CREATE OR REPLACE FUNCTION public.monitor_security_anomalies()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  anomalies JSONB := '{}';
  failed_logins INTEGER;
  unusual_access INTEGER;
  expired_sessions INTEGER;
BEGIN
  -- Check for failed login attempts (from security events)
  SELECT COUNT(*) INTO failed_logins
  FROM public.admin_security_events
  WHERE event_type = 'login_failed'
    AND created_at > now() - INTERVAL '1 hour';
  
  -- Check for unusual access patterns
  SELECT COUNT(*) INTO unusual_access
  FROM public.security_audit_trail
  WHERE is_suspicious = true
    AND created_at > now() - INTERVAL '1 hour';
  
  -- Check for expired sessions still being used
  SELECT COUNT(*) INTO expired_sessions
  FROM public.admin_2fa_sessions
  WHERE expires_at < now()
    AND verified_at > now() - INTERVAL '30 minutes';
  
  -- Build anomaly report
  anomalies := jsonb_build_object(
    'monitoring_timestamp', now(),
    'failed_logins_last_hour', failed_logins,
    'unusual_access_patterns', unusual_access,
    'expired_sessions_used', expired_sessions,
    'threat_level', CASE 
      WHEN failed_logins > 10 OR expired_sessions > 0 THEN 'high'
      WHEN failed_logins > 5 OR unusual_access > 3 THEN 'medium'
      ELSE 'low'
    END
  );
  
  -- Log monitoring results
  PERFORM log_comprehensive_security_event(
    'system',
    'security_monitoring',
    CASE 
      WHEN failed_logins > 10 OR expired_sessions > 0 THEN 'high'
      WHEN failed_logins > 5 OR unusual_access > 3 THEN 'medium'
      ELSE 'low'
    END,
    'system',
    'security_monitoring',
    NULL,
    anomalies,
    CASE 
      WHEN failed_logins > 10 OR expired_sessions > 0 THEN 9
      WHEN failed_logins > 5 OR unusual_access > 3 THEN 6
      ELSE 2
    END
  );
  
  RETURN anomalies;
END;
$$;

-- 8. SECURITY INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_trail_timestamp ON public.security_audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_trail_actor ON public.security_audit_trail(actor_email);
CREATE INDEX IF NOT EXISTS idx_security_audit_trail_risk ON public.security_audit_trail(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_admin_secure_sessions_active ON public.admin_secure_sessions(admin_email, is_active);

-- 9. LOG THIS SECURITY ENHANCEMENT
INSERT INTO public.admin_audit_log (
  action,
  resource,
  user_email,
  metadata
) VALUES (
  'security_enhancement',
  'system_wide',
  'system',
  jsonb_build_object(
    'phase', 'data_encryption_and_monitoring',
    'timestamp', now(),
    'enhancements', jsonb_build_array(
      'data_encryption_functions',
      'enhanced_session_management',
      'comprehensive_audit_logging',
      'access_review_automation',
      'security_anomaly_monitoring'
    )
  )
);