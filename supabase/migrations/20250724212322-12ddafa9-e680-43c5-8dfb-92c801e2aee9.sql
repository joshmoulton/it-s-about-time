-- Fix remaining search_path security issues
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is in admin_users table
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = user_email 
        AND is_active = true
    );
END;
$$;

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

-- Create additional security validation functions
CREATE OR REPLACE FUNCTION public.validate_email_format(email_input TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
    IF email_input IS NULL OR length(email_input) = 0 THEN
        RETURN false;
    END IF;
    
    -- Basic email format validation
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type TEXT,
    admin_email TEXT,
    success BOOLEAN,
    event_details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.admin_security_events (
        event_type,
        admin_email,
        success,
        event_details,
        ip_address,
        user_agent
    ) VALUES (
        event_type,
        admin_email,
        success,
        event_details,
        ip_address,
        user_agent
    );
END;
$$;

-- Create rate limiting function for authentication attempts
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
    user_email TEXT,
    client_ip INET,
    max_attempts INTEGER DEFAULT 5,
    window_minutes INTEGER DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_attempts INTEGER;
    is_blocked BOOLEAN := false;
BEGIN
    -- Check if IP is currently blocked
    SELECT blocked_until IS NOT NULL AND blocked_until > now()
    INTO is_blocked
    FROM public.auth_rate_limits
    WHERE ip_address = client_ip;
    
    IF is_blocked THEN
        RETURN false;
    END IF;
    
    -- Count recent attempts for this email/IP combination
    SELECT COALESCE(attempt_count, 0)
    INTO current_attempts
    FROM public.auth_rate_limits
    WHERE (email = user_email OR ip_address = client_ip)
    AND window_start > now() - (window_minutes || ' minutes')::interval;
    
    -- Block if too many attempts
    IF current_attempts >= max_attempts THEN
        -- Update or insert rate limit record with block
        INSERT INTO public.auth_rate_limits (
            email, ip_address, attempt_count, blocked_until, window_start
        ) VALUES (
            user_email, client_ip, current_attempts + 1, 
            now() + (window_minutes || ' minutes')::interval, now()
        )
        ON CONFLICT (ip_address) DO UPDATE SET
            attempt_count = auth_rate_limits.attempt_count + 1,
            blocked_until = now() + (window_minutes || ' minutes')::interval,
            updated_at = now();
        
        RETURN false;
    END IF;
    
    -- Increment attempt counter
    INSERT INTO public.auth_rate_limits (
        email, ip_address, attempt_count, window_start
    ) VALUES (
        user_email, client_ip, 1, now()
    )
    ON CONFLICT (ip_address) DO UPDATE SET
        attempt_count = auth_rate_limits.attempt_count + 1,
        updated_at = now();
    
    RETURN true;
END;
$$;

-- Create secure password validation function
CREATE OR REPLACE FUNCTION public.validate_password_security(password_input TEXT)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{"valid": true, "errors": []}'::jsonb;
    errors text[] := '{}';
BEGIN
    IF password_input IS NULL THEN
        RETURN '{"valid": false, "errors": ["Password cannot be null"]}'::jsonb;
    END IF;
    
    -- Check minimum length
    IF length(password_input) < 8 THEN
        errors := array_append(errors, 'Password must be at least 8 characters long');
    END IF;
    
    -- Check for uppercase letter
    IF password_input !~ '[A-Z]' THEN
        errors := array_append(errors, 'Password must contain at least one uppercase letter');
    END IF;
    
    -- Check for lowercase letter
    IF password_input !~ '[a-z]' THEN
        errors := array_append(errors, 'Password must contain at least one lowercase letter');
    END IF;
    
    -- Check for number
    IF password_input !~ '[0-9]' THEN
        errors := array_append(errors, 'Password must contain at least one number');
    END IF;
    
    -- Check for special character
    IF password_input !~ '[^A-Za-z0-9]' THEN
        errors := array_append(errors, 'Password must contain at least one special character');
    END IF;
    
    -- Check for common weak patterns
    IF password_input ~* '(password|123456|qwerty|admin|user)' THEN
        errors := array_append(errors, 'Password contains common weak patterns');
    END IF;
    
    IF array_length(errors, 1) > 0 THEN
        result := jsonb_build_object('valid', false, 'errors', errors);
    END IF;
    
    RETURN result;
END;
$$;