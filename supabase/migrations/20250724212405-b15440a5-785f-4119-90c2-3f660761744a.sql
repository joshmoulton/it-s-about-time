-- Drop conflicting function and recreate with proper security
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(text, text);

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data_to_encrypt text, key_id text DEFAULT 'default')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    encryption_key TEXT;
    encrypted_result TEXT;
BEGIN
    -- Get encryption key from vault (simplified for demo)
    encryption_key := 'demo_key_' || key_id;
    
    -- Encrypt the data
    encrypted_result := encode(
        encrypt(
            data_to_encrypt::bytea,
            encryption_key::bytea,
            'aes'
        ),
        'base64'
    );
    
    RETURN encrypted_result;
END;
$$;

-- Create session token validation function
CREATE OR REPLACE FUNCTION public.validate_session_token(token_input TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    session_record RECORD;
    result jsonb;
BEGIN
    IF token_input IS NULL OR length(token_input) = 0 THEN
        RETURN '{"valid": false, "error": "Token is required"}'::jsonb;
    END IF;
    
    -- Check if session exists and is valid
    SELECT *
    INTO session_record
    FROM public.admin_secure_sessions
    WHERE session_token = token_input
    AND expires_at > now()
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN '{"valid": false, "error": "Invalid or expired session"}'::jsonb;
    END IF;
    
    -- Update last activity
    UPDATE public.admin_secure_sessions
    SET last_activity_at = now()
    WHERE session_token = token_input;
    
    RETURN jsonb_build_object(
        'valid', true,
        'admin_email', session_record.admin_email,
        'security_level', session_record.security_level,
        'expires_at', session_record.expires_at
    );
END;
$$;

-- Create comprehensive input sanitization function
CREATE OR REPLACE FUNCTION public.comprehensive_sanitize_input(
    input_value TEXT,
    input_type TEXT DEFAULT 'general'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
    IF input_value IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove null bytes
    input_value := replace(input_value, chr(0), '');
    
    CASE input_type
        WHEN 'email' THEN
            -- Email specific sanitization
            input_value := lower(trim(input_value));
            input_value := regexp_replace(input_value, '[^a-z0-9@._+-]', '', 'g');
            
        WHEN 'username' THEN
            -- Username specific sanitization
            input_value := trim(input_value);
            input_value := regexp_replace(input_value, '[^a-zA-Z0-9._-]', '', 'g');
            
        WHEN 'html' THEN
            -- HTML content sanitization (more restrictive)
            input_value := regexp_replace(input_value, '<script[^>]*>.*?</script>', '', 'gi');
            input_value := regexp_replace(input_value, '<iframe[^>]*>.*?</iframe>', '', 'gi');
            input_value := regexp_replace(input_value, 'javascript:', '', 'gi');
            input_value := regexp_replace(input_value, 'on\w+\s*=', '', 'gi');
            
        ELSE
            -- General sanitization
            input_value := trim(input_value);
            input_value := regexp_replace(input_value, '<[^>]*>', '', 'g');
            input_value := regexp_replace(input_value, 'javascript:', '', 'gi');
    END CASE;
    
    RETURN input_value;
END;
$$;