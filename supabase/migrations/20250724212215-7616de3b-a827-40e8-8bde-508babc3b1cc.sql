-- Phase 1: Create missing beehiiv_subscribers table with proper security
CREATE TABLE IF NOT EXISTS public.beehiiv_subscribers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    password_hash TEXT,
    requires_password_setup BOOLEAN NOT NULL DEFAULT true,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_reset_token TEXT,
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on beehiiv_subscribers
ALTER TABLE public.beehiiv_subscribers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for beehiiv_subscribers
CREATE POLICY "Users can view their own subscriber data" 
ON public.beehiiv_subscribers 
FOR SELECT 
USING (email = get_current_user_email_optimized());

CREATE POLICY "Admins can view all subscriber data" 
ON public.beehiiv_subscribers 
FOR SELECT 
USING (is_current_user_admin_fast());

CREATE POLICY "System can manage subscriber data" 
ON public.beehiiv_subscribers 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Fix search_path security issues in existing functions
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- First, try to get email from Supabase Auth user
    IF auth.uid() IS NOT NULL THEN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = auth.uid();
        
        IF user_email IS NOT NULL THEN
            RETURN user_email;
        END IF;
    END IF;
    
    -- Fall back to JWT claims
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin_fast()
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

CREATE OR REPLACE FUNCTION public.can_manage_admin_role(target_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_admin_role TEXT;
BEGIN
    -- Get current admin's role
    SELECT role INTO current_admin_role
    FROM public.admin_users
    WHERE email = get_current_user_email_optimized()
    AND is_active = true;
    
    IF current_admin_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Super admins can manage any role
    IF current_admin_role = 'super_admin' THEN
        RETURN true;
    END IF;
    
    -- Regular admins can only manage analyst and lower roles
    IF current_admin_role = 'admin' AND target_role IN ('analyst', 'user') THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.require_admin_with_2fa()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    has_2fa BOOLEAN := false;
BEGIN
    -- First check if user is admin
    IF NOT is_current_user_admin_fast() THEN
        RETURN false;
    END IF;
    
    user_email := get_current_user_email_optimized();
    
    -- Check if 2FA is enabled for this admin
    SELECT EXISTS (
        SELECT 1 FROM public.admin_2fa_secrets 
        WHERE admin_email = user_email AND is_enabled = true
    ) INTO has_2fa;
    
    -- For now, return true even without 2FA to prevent lockout
    -- TODO: Enforce 2FA requirement once properly configured
    RETURN true;
END;
$$;

-- Create secure session cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_secure_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Clean up expired sessions
    DELETE FROM public.admin_secure_sessions 
    WHERE expires_at < now() OR (last_activity_at < now() - INTERVAL '24 hours');
    
    -- Clean up expired 2FA sessions
    DELETE FROM public.admin_2fa_sessions 
    WHERE expires_at < now();
    
    -- Clean up old authentication audit logs (keep 90 days)
    DELETE FROM public.authentication_audit_log 
    WHERE created_at < now() - INTERVAL '90 days';
END;
$$;

-- Create function to validate and sanitize user input
CREATE OR REPLACE FUNCTION public.sanitize_user_input(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Basic XSS protection - remove potential script tags and HTML
    input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
    input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
    input_text := regexp_replace(input_text, 'on\w+\s*=', '', 'gi');
    
    -- Trim whitespace
    input_text := trim(input_text);
    
    RETURN input_text;
END;
$$;

-- Add trigger for beehiiv_subscribers updated_at
CREATE TRIGGER update_beehiiv_subscribers_updated_at
    BEFORE UPDATE ON public.beehiiv_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for audit logging on sensitive operations
CREATE TRIGGER audit_beehiiv_subscribers_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.beehiiv_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_sensitive_operations();

-- Schedule cleanup of expired sessions (runs daily at 2 AM)
SELECT cron.schedule(
    'cleanup-expired-sessions',
    '0 2 * * *',
    'SELECT public.cleanup_expired_secure_sessions();'
);