-- Fix search path for all mutable functions to improve security

-- Fix verify_2fa_token function
CREATE OR REPLACE FUNCTION public.verify_2fa_token(p_admin_email text, p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    stored_secret TEXT;
    is_valid BOOLEAN := FALSE;
BEGIN
    -- Get the secret for this admin
    SELECT secret_key INTO stored_secret
    FROM public.admin_2fa_secrets
    WHERE admin_email = p_admin_email AND is_enabled = true;
    
    IF stored_secret IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Note: Actual TOTP verification will be done in the application layer
    -- This function is a placeholder for database-side validation if needed
    -- For now, we'll return true if secret exists (app will do real verification)
    RETURN TRUE;
END;
$function$;

-- Fix assign_progressive_newsletter_dates function
CREATE OR REPLACE FUNCTION public.assign_progressive_newsletter_dates()
 RETURNS TABLE(updated_count integer, message text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  newsletter_record RECORD;
  start_date DATE := '2022-07-01';
  end_date DATE := CURRENT_DATE;
  total_newsletters INTEGER;
  day_increment NUMERIC;
  current_index INTEGER := 0;
  assigned_date TIMESTAMP WITH TIME ZONE;
  updated_count INTEGER := 0;
BEGIN
  -- Count newsletters needing date assignment
  SELECT COUNT(*) INTO total_newsletters 
  FROM newsletters 
  WHERE beehiiv_created_at IS NULL;
  
  -- Calculate day increment for even distribution
  day_increment := (end_date - start_date)::NUMERIC / GREATEST(total_newsletters - 1, 1);
  
  -- Process each newsletter without dates (ordered by created_at desc = newest first)
  FOR newsletter_record IN 
    SELECT id, title 
    FROM newsletters 
    WHERE beehiiv_created_at IS NULL 
    ORDER BY created_at DESC
  LOOP
    -- Calculate progressive date (newest newsletters get recent dates)
    assigned_date := end_date - (current_index * day_increment * INTERVAL '1 day');
    
    -- Add random time within the day
    assigned_date := assigned_date + (EXTRACT(hour FROM NOW()) || ' hours')::INTERVAL;
    assigned_date := assigned_date + (floor(random() * 60) || ' minutes')::INTERVAL;
    
    -- Update the newsletter
    UPDATE newsletters 
    SET 
      beehiiv_created_at = assigned_date,
      published_at = assigned_date,
      updated_at = NOW()
    WHERE id = newsletter_record.id;
    
    updated_count := updated_count + 1;
    current_index := current_index + 1;
    
    -- Log progress every 50 updates
    IF updated_count % 50 = 0 THEN
      RAISE NOTICE 'Updated % newsletters so far...', updated_count;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT updated_count, 'Successfully assigned progressive dates to ' || updated_count || ' newsletters from ' || start_date || ' to ' || end_date;
END;
$function$;

-- Fix require_2fa_for_sensitive_operation function
CREATE OR REPLACE FUNCTION public.require_2fa_for_sensitive_operation(p_operation_type text, p_session_token text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_email TEXT;
    has_2fa BOOLEAN;
    session_valid BOOLEAN := FALSE;
BEGIN
    current_email := get_current_user_email();
    
    IF current_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if admin has 2FA enabled
    has_2fa := admin_has_2fa_enabled(current_email);
    
    IF NOT has_2fa THEN
        -- Log security event
        PERFORM log_admin_security_event(
            current_email,
            'sensitive_access_no_2fa',
            jsonb_build_object('operation', p_operation_type),
            NULL, NULL, NULL, false
        );
        RETURN FALSE;
    END IF;
    
    -- Verify 2FA session if provided
    IF p_session_token IS NOT NULL THEN
        session_valid := (verify_2fa_session(p_session_token)->>'valid')::boolean;
    END IF;
    
    IF NOT session_valid THEN
        -- Log security event
        PERFORM log_admin_security_event(
            current_email,
            'sensitive_access_invalid_2fa',
            jsonb_build_object('operation', p_operation_type),
            NULL, NULL, NULL, false
        );
        RETURN FALSE;
    END IF;
    
    -- Log successful access
    PERFORM log_admin_security_event(
        current_email,
        'sensitive_access_success',
        jsonb_build_object('operation', p_operation_type),
        NULL, NULL, NULL, true
    );
    
    RETURN TRUE;
END;
$function$;

-- Fix admin_has_2fa_enabled function
CREATE OR REPLACE FUNCTION public.admin_has_2fa_enabled(p_admin_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_2fa_secrets 
        WHERE admin_email = p_admin_email AND is_enabled = true
    );
END;
$function$;

-- Fix log_admin_security_event function
CREATE OR REPLACE FUNCTION public.log_admin_security_event(p_admin_email text, p_event_type text, p_event_details jsonb DEFAULT '{}'::jsonb, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_device_fingerprint text DEFAULT NULL::text, p_success boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.admin_security_events (
        admin_email, event_type, event_details, ip_address, 
        user_agent, device_fingerprint, success
    ) VALUES (
        p_admin_email, p_event_type, p_event_details, p_ip_address,
        p_user_agent, p_device_fingerprint, p_success
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$function$;

-- Fix create_2fa_session function
CREATE OR REPLACE FUNCTION public.create_2fa_session(p_admin_email text, p_expires_minutes integer DEFAULT 15, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_device_fingerprint text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    session_token TEXT;
    session_id UUID;
BEGIN
    -- Generate secure session token
    session_token := encode(gen_random_bytes(32), 'base64');
    
    -- Clean up expired sessions
    DELETE FROM public.admin_2fa_sessions WHERE expires_at < now();
    
    -- Create new session
    INSERT INTO public.admin_2fa_sessions (
        admin_email, session_token, expires_at, ip_address, user_agent, device_fingerprint
    ) VALUES (
        p_admin_email,
        session_token,
        now() + (p_expires_minutes || ' minutes')::interval,
        p_ip_address,
        p_user_agent,
        p_device_fingerprint
    ) RETURNING id INTO session_id;
    
    RETURN session_token;
END;
$function$;

-- Fix encrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data text, p_key_id text DEFAULT 'default'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    encryption_key TEXT;
    encrypted_result TEXT;
BEGIN
    -- Get encryption key from vault (simplified for demo)
    encryption_key := 'demo_key_' || p_key_id;
    
    -- Encrypt the data using pgcrypto
    encrypted_result := encode(
        encrypt(
            p_data::bytea,
            encryption_key::bytea,
            'aes'
        ),
        'base64'
    );
    
    RETURN encrypted_result;
END;
$function$;

-- Fix decrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(p_encrypted_data text, p_key_id text DEFAULT 'default'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    encryption_key TEXT;
    decrypted_result TEXT;
BEGIN
    -- Get encryption key from vault (simplified for demo)
    encryption_key := 'demo_key_' || p_key_id;
    
    -- Decrypt the data
    decrypted_result := convert_from(
        decrypt(
            decode(p_encrypted_data, 'base64'),
            encryption_key::bytea,
            'aes'
        ),
        'UTF8'
    );
    
    RETURN decrypted_result;
END;
$function$;

-- Fix extract_analyst_call_data function
CREATE OR REPLACE FUNCTION public.extract_analyst_call_data(message_text text, pattern_config jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  extracted_data JSONB := '{}';
  symbol_match TEXT;
  entry_match TEXT;
  stop_loss_match TEXT;
  targets_match TEXT[];
  position_type_match TEXT;
  risk_match TEXT;
BEGIN
  -- Extract symbol/ticker (look for common patterns like $BTC, BTC, etc.)
  symbol_match := (regexp_match(message_text, '\$?([A-Z]{2,10})', 'i'))[1];
  IF symbol_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{symbol}', to_jsonb(symbol_match));
  END IF;
  
  -- Extract entry price (look for patterns like "Entry: 50000", "@ 50k", etc.)
  entry_match := (regexp_match(message_text, '(?:entry|@|buy)\s*:?\s*\$?([0-9,]+\.?[0-9]*)', 'i'))[1];
  IF entry_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{entry_price}', to_jsonb(replace(entry_match, ',', '')::numeric));
  END IF;
  
  -- Extract stop loss (look for patterns like "SL: 45000", "Stop: 45k", etc.)
  stop_loss_match := (regexp_match(message_text, '(?:sl|stop|stop loss)\s*:?\s*\$?([0-9,]+\.?[0-9]*)', 'i'))[1];
  IF stop_loss_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{stop_loss_price}', to_jsonb(replace(stop_loss_match, ',', '')::numeric));
  END IF;
  
  -- Extract position type (long/short)
  position_type_match := (regexp_match(message_text, '\b(long|short)\b', 'i'))[1];
  IF position_type_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb(lower(position_type_match)));
  ELSE
    -- Default to long if not specified
    extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb('long'));
  END IF;
  
  -- Extract targets (look for patterns like "TP1: 55000, TP2: 60000")
  SELECT array_agg(replace(match_group, ',', '')::numeric ORDER BY ordinality)
  INTO targets_match
  FROM regexp_split_to_table(
    (regexp_match(message_text, '(?:tp|target|take profit)s?\s*:?\s*([\d,.\s]+)', 'i'))[1], 
    '\s+'
  ) WITH ORDINALITY AS t(match_group, ordinality)
  WHERE match_group ~ '^[0-9,]+\.?[0-9]*$';
  
  IF targets_match IS NOT NULL AND array_length(targets_match, 1) > 0 THEN
    extracted_data := jsonb_set(extracted_data, '{targets}', to_jsonb(targets_match));
  END IF;
  
  -- Extract risk percentage
  risk_match := (regexp_match(message_text, '(?:risk|r)\s*:?\s*([0-9]+)\s*%', 'i'))[1];
  IF risk_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{risk_percentage}', to_jsonb(risk_match::integer));
  ELSE
    extracted_data := jsonb_set(extracted_data, '{risk_percentage}', to_jsonb(2)); -- Default 2% risk
  END IF;
  
  -- Set market type (default to crypto for now)
  extracted_data := jsonb_set(extracted_data, '{market}', to_jsonb('crypto'));
  
  -- Set entry type (default to market)
  extracted_data := jsonb_set(extracted_data, '{entry_type}', to_jsonb('market'));
  
  RETURN extracted_data;
END;
$function$;

-- Add missing functions with proper search path
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
  IF extracted_data ? 'targets' AND jsonb_array_length(extracted_data->'targets') > 0 THEN
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

-- Add other missing utility functions with proper search path
CREATE OR REPLACE FUNCTION public.is_ip_allowed(p_ip_address inet, p_admin_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_ip_allowlist
        WHERE admin_email = p_admin_email
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND p_ip_address << ip_address
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_business_hours()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Define business hours as 9 AM to 5 PM UTC, Monday to Friday
    RETURN (
        EXTRACT(dow FROM now()) BETWEEN 1 AND 5 AND
        EXTRACT(hour FROM now()) BETWEEN 9 AND 17
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_device_authorized(p_device_fingerprint text, p_admin_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_device_auth
        WHERE admin_email = p_admin_email
        AND device_fingerprint = p_device_fingerprint
        AND is_trusted = true
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_data_access_quota(p_admin_email text, p_resource_type text)
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
    WHERE admin_email = p_admin_email
    AND resource_type = p_resource_type
    AND period_start <= now()
    AND period_end > now();
    
    IF NOT FOUND THEN
        RETURN true; -- No quota defined, allow access
    END IF;
    
    RETURN current_quota.quota_used < current_quota.quota_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.require_secure_data_access(p_operation_type text, p_resource_id text DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    admin_email TEXT;
    has_access BOOLEAN := false;
BEGIN
    admin_email := get_current_user_email();
    
    IF admin_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is authorized admin
    IF NOT is_current_user_admin() THEN
        RETURN false;
    END IF;
    
    -- Check data access quota
    IF NOT check_data_access_quota(admin_email, p_operation_type) THEN
        RETURN false;
    END IF;
    
    -- Log the access attempt
    INSERT INTO public.data_access_logs (
        admin_email, action_type, resource_type, resource_id, access_granted
    ) VALUES (
        admin_email, p_operation_type, p_operation_type, p_resource_id, true
    );
    
    RETURN true;
END;
$function$;