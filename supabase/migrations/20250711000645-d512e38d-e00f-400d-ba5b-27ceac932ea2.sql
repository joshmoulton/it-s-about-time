-- Phase 4: Advanced Authentication & 2FA Implementation
-- Remove business hours restrictions and add 2FA infrastructure

-- Update business hours function to always return true
CREATE OR REPLACE FUNCTION public.is_business_hours()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Always return true - we work all the time
    RETURN TRUE;
END;
$$;

-- Create 2FA secrets table for admin users
CREATE TABLE public.admin_2fa_secrets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    backup_codes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    device_fingerprints JSONB DEFAULT '[]'
);

-- Enable RLS on 2FA secrets
ALTER TABLE public.admin_2fa_secrets ENABLE ROW LEVEL SECURITY;

-- Create 2FA verification sessions table
CREATE TABLE public.admin_2fa_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on 2FA sessions
ALTER TABLE public.admin_2fa_sessions ENABLE ROW LEVEL SECURITY;

-- Create admin security events table
CREATE TABLE public.admin_security_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'login_attempt', '2fa_setup', '2fa_verify', 'sensitive_access', 'failed_2fa'
    event_details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.admin_security_events ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_admin_2fa_secrets_email ON public.admin_2fa_secrets(admin_email);
CREATE INDEX idx_admin_2fa_sessions_token ON public.admin_2fa_sessions(session_token);
CREATE INDEX idx_admin_2fa_sessions_expires ON public.admin_2fa_sessions(expires_at);
CREATE INDEX idx_admin_security_events_email ON public.admin_security_events(admin_email);
CREATE INDEX idx_admin_security_events_type ON public.admin_security_events(event_type);
CREATE INDEX idx_admin_security_events_created ON public.admin_security_events(created_at);

-- RLS policies for 2FA secrets
CREATE POLICY "Admins can view their own 2FA secrets"
ON public.admin_2fa_secrets
FOR SELECT
USING (admin_email = get_current_user_email());

CREATE POLICY "Admins can update their own 2FA secrets"
ON public.admin_2fa_secrets
FOR UPDATE
USING (admin_email = get_current_user_email());

CREATE POLICY "Admins can insert their own 2FA secrets"
ON public.admin_2fa_secrets
FOR INSERT
WITH CHECK (admin_email = get_current_user_email());

CREATE POLICY "Super admins can view all 2FA secrets"
ON public.admin_2fa_secrets
FOR SELECT
USING (has_admin_role('super_admin'));

-- RLS policies for 2FA sessions
CREATE POLICY "Admins can view their own 2FA sessions"
ON public.admin_2fa_sessions
FOR SELECT
USING (admin_email = get_current_user_email());

CREATE POLICY "System can manage 2FA sessions"
ON public.admin_2fa_sessions
FOR ALL
USING (true);

-- RLS policies for security events
CREATE POLICY "Admins can view their own security events"
ON public.admin_security_events
FOR SELECT
USING (admin_email = get_current_user_email());

CREATE POLICY "Super admins can view all security events"
ON public.admin_security_events
FOR SELECT
USING (has_admin_role('super_admin'));

CREATE POLICY "System can insert security events"
ON public.admin_security_events
FOR INSERT
WITH CHECK (true);

-- Function to verify 2FA token
CREATE OR REPLACE FUNCTION public.verify_2fa_token(p_admin_email TEXT, p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to check if admin has 2FA enabled
CREATE OR REPLACE FUNCTION public.admin_has_2fa_enabled(p_admin_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_2fa_secrets 
        WHERE admin_email = p_admin_email AND is_enabled = true
    );
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_admin_security_event(
    p_admin_email TEXT,
    p_event_type TEXT,
    p_event_details JSONB DEFAULT '{}',
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to create 2FA session
CREATE OR REPLACE FUNCTION public.create_2fa_session(
    p_admin_email TEXT,
    p_expires_minutes INTEGER DEFAULT 15,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to verify 2FA session
CREATE OR REPLACE FUNCTION public.verify_2fa_session(p_session_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record RECORD;
    result JSONB;
BEGIN
    SELECT * INTO session_record
    FROM public.admin_2fa_sessions
    WHERE session_token = p_session_token
    AND expires_at > now()
    AND verified_at IS NOT NULL;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'valid', true,
            'admin_email', session_record.admin_email,
            'expires_at', session_record.expires_at
        );
    ELSE
        result := jsonb_build_object('valid', false);
    END IF;
    
    RETURN result;
END;
$$;

-- Update admin_users table to track 2FA requirement
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS requires_2fa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_2fa_setup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_2fa_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_admin_2fa_secrets_updated_at
    BEFORE UPDATE ON public.admin_2fa_secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to require 2FA for sensitive operations
CREATE OR REPLACE FUNCTION public.require_2fa_for_sensitive_operation(
    p_operation_type TEXT,
    p_session_token TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;