-- Fix search path security issues by dropping and recreating functions

-- Drop functions that have parameter conflicts
DROP FUNCTION IF EXISTS public.is_device_authorized(text, text);
DROP FUNCTION IF EXISTS public.check_data_access_quota(text, text);
DROP FUNCTION IF EXISTS public.is_ip_allowed(inet, text);

-- Recreate with proper search path and parameter names
CREATE OR REPLACE FUNCTION public.is_device_authorized(device_fingerprint text, admin_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_device_auth
        WHERE admin_device_auth.admin_email = is_device_authorized.admin_email
        AND admin_device_auth.device_fingerprint = is_device_authorized.device_fingerprint
        AND is_trusted = true
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_ip_allowed(ip_address inet, admin_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_ip_allowlist
        WHERE admin_ip_allowlist.admin_email = is_ip_allowed.admin_email
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND is_ip_allowed.ip_address << admin_ip_allowlist.ip_address
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_data_access_quota(admin_email text, resource_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_quota RECORD;
BEGIN
    SELECT * INTO current_quota
    FROM public.data_access_quotas
    WHERE data_access_quotas.admin_email = check_data_access_quota.admin_email
    AND data_access_quotas.resource_type = check_data_access_quota.resource_type
    AND period_start <= now()
    AND period_end > now();
    
    IF NOT FOUND THEN
        RETURN true; -- No quota defined, allow access
    END IF;
    
    RETURN current_quota.quota_used < current_quota.quota_limit;
END;
$function$;

-- Fix the incomplete calculate_detection_confidence function
CREATE OR REPLACE FUNCTION public.calculate_detection_confidence(message_text text, extracted_data jsonb)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  confidence_score NUMERIC := 0.0;
  total_criteria INTEGER := 5;
  met_criteria INTEGER := 0;
BEGIN
  -- Check if symbol is present
  IF extracted_data ? 'symbol' AND extracted_data->>'symbol' IS NOT NULL THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if entry price is present
  IF extracted_data ? 'entry_price' AND extracted_data->>'entry_price' IS NOT NULL THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if stop loss is present
  IF extracted_data ? 'stop_loss_price' AND extracted_data->>'stop_loss_price' IS NOT NULL THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if targets are present
  IF extracted_data ? 'targets' AND jsonb_array_length(COALESCE(extracted_data->'targets', '[]'::jsonb)) > 0 THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if trade direction is present
  IF extracted_data ? 'trade_direction' AND extracted_data->>'trade_direction' IS NOT NULL THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Calculate confidence as percentage
  confidence_score := (met_criteria::NUMERIC / total_criteria::NUMERIC) * 100.0;
  
  RETURN confidence_score;
END;
$function$;

-- Add missing function for data access logging
CREATE OR REPLACE FUNCTION public.log_data_access(admin_email text, action_type text, resource_type text, resource_id text DEFAULT NULL, access_granted boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.data_access_logs (
        admin_email, action_type, resource_type, resource_id, access_granted
    ) VALUES (
        log_data_access.admin_email, 
        log_data_access.action_type, 
        log_data_access.resource_type, 
        log_data_access.resource_id, 
        log_data_access.access_granted
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$;

-- Add function to update updated_at columns automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;