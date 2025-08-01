-- Fix remaining performance issues in Supabase - Part 2: Function fixes and optimizations

-- 3. Fix function search path issues
-- Update functions to have proper search_path settings

CREATE OR REPLACE FUNCTION public.log_data_access(
    p_user_id uuid DEFAULT NULL,
    p_admin_email text DEFAULT NULL,
    p_resource_type text DEFAULT NULL,
    p_resource_id text DEFAULT NULL,
    p_action_type text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_geo_location jsonb DEFAULT NULL,
    p_device_fingerprint text DEFAULT NULL,
    p_access_granted boolean DEFAULT false,
    p_denial_reason text DEFAULT NULL,
    p_risk_score numeric DEFAULT 0.0
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.data_access_logs (
        user_id, admin_email, resource_type, resource_id, action_type,
        ip_address, user_agent, geo_location, device_fingerprint,
        access_granted, denial_reason, risk_score
    ) VALUES (
        p_user_id, p_admin_email, p_resource_type, p_resource_id, p_action_type,
        p_ip_address, p_user_agent, p_geo_location, p_device_fingerprint,
        p_access_granted, p_denial_reason, p_risk_score
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_ip_allowed(p_admin_email text, p_ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    is_allowed BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.admin_ip_allowlist
        WHERE admin_email = p_admin_email
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND (
            ip_address = p_ip_address OR
            p_ip_address <<= (ip_address::text || '/' || subnet_mask::text)::inet
        )
    ) INTO is_allowed;
    
    RETURN is_allowed;
END;
$function$;

CREATE OR REPLACE FUNCTION public.require_secure_data_access(
    p_operation_type text,
    p_resource_type text DEFAULT 'sensitive_data',
    p_ip_address inet DEFAULT NULL,
    p_device_fingerprint text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_email TEXT;
    ip_allowed BOOLEAN := true;
    device_authorized BOOLEAN := true;
    risk_score NUMERIC := 0.0;
    access_granted BOOLEAN := false;
BEGIN
    current_email := get_current_user_email();
    
    IF current_email IS NULL THEN
        PERFORM log_data_access(
            NULL, NULL, p_resource_type, NULL, p_operation_type,
            p_ip_address, NULL, NULL, p_device_fingerprint,
            false, 'No authenticated user', 10.0
        );
        RETURN FALSE;
    END IF;
    
    -- Check IP allowlist if IP provided
    IF p_ip_address IS NOT NULL THEN
        ip_allowed := is_ip_allowed(current_email, p_ip_address);
        IF NOT ip_allowed THEN
            risk_score := risk_score + 5.0;
        END IF;
    END IF;
    
    -- Check device authorization if fingerprint provided
    IF p_device_fingerprint IS NOT NULL THEN
        device_authorized := is_device_authorized(current_email, p_device_fingerprint);
        IF NOT device_authorized THEN
            risk_score := risk_score + 3.0;
        END IF;
    END IF;
    
    -- Determine access based on checks
    access_granted := ip_allowed AND device_authorized AND risk_score < 5.0;
    
    -- Log the access attempt
    PERFORM log_data_access(
        NULL, current_email, p_resource_type, NULL, p_operation_type,
        p_ip_address, NULL, NULL, p_device_fingerprint,
        access_granted, 
        CASE WHEN NOT access_granted THEN 
            'Access denied: IP=' || ip_allowed::text || 
            ', Device=' || device_authorized::text
        ELSE NULL END,
        risk_score
    );
    
    RETURN access_granted;
END;
$function$;

-- 4. Drop and recreate the check_data_access_quota function with proper signature
DROP FUNCTION IF EXISTS public.check_data_access_quota(text, text);

CREATE OR REPLACE FUNCTION public.check_data_access_quota(
    admin_email_param text,
    resource_type_param text
) RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    quota_limit INTEGER;
    quota_used INTEGER;
    has_quota BOOLEAN := true;
BEGIN
    -- Get current quota information
    SELECT q.quota_limit, q.quota_used INTO quota_limit, quota_used
    FROM public.data_access_quotas q
    WHERE q.admin_email = admin_email_param 
    AND q.resource_type = resource_type_param
    AND q.period_end > now()
    ORDER BY q.created_at DESC
    LIMIT 1;
    
    -- If no quota record exists, allow access (no quota restrictions)
    IF quota_limit IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if under quota
    has_quota := COALESCE(quota_used, 0) < quota_limit;
    
    RETURN has_quota;
END;
$function$;