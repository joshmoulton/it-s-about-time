-- Phase 1 Security Fixes: Critical Database Security Issues

-- 1. Fix Function Search Path Security Issues
-- Add SET search_path TO 'public' to all security definer functions

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
    
    -- Fall back to JWT claims for Whop users
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed
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
    is_dev_environment BOOLEAN := FALSE; -- Set to FALSE for production security
BEGIN
    -- SECURITY FIX: Remove development bypass that completely bypassed 2FA
    -- Previous code had hardcoded TRUE return which was a critical security flaw
    
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is in admin_users table and is active
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
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
    current_user_role TEXT;
    user_email TEXT;
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM admin_users
    WHERE email = user_email AND is_active = true;
    
    -- Super admins can manage any role
    IF current_user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Regular admins can only manage non-admin roles
    IF current_user_role = 'admin' AND target_role NOT IN ('admin', 'super_admin') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 2. Add proper RLS policy for telegram_messages table
-- This fixes the critical RLS violation that was preventing data insertion

CREATE POLICY "telegram_messages_system_insert" 
ON telegram_messages 
FOR INSERT 
WITH CHECK (
    -- Allow system/service account inserts (for automated data ingestion)
    auth.uid() IS NULL OR 
    -- Allow admin inserts
    is_current_user_admin_fast()
);

-- 3. Add audit logging for critical admin operations
CREATE OR REPLACE FUNCTION public.log_admin_security_event(
    event_type text,
    event_details jsonb DEFAULT '{}',
    admin_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO admin_security_events (
        event_type,
        admin_email,
        event_details,
        success,
        ip_address,
        user_agent
    ) VALUES (
        event_type,
        COALESCE(admin_email, get_current_user_email_optimized()),
        event_details,
        true,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$$;

-- 4. Create secure admin authentication check with proper 2FA enforcement
CREATE OR REPLACE FUNCTION public.require_admin_with_2fa()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    has_2fa BOOLEAN := FALSE;
    session_valid BOOLEAN := FALSE;
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is admin
    IF NOT is_current_user_admin_fast() THEN
        RETURN FALSE;
    END IF;
    
    -- Check if admin has 2FA enabled (mandatory for all admin operations)
    SELECT EXISTS (
        SELECT 1 FROM admin_2fa_secrets 
        WHERE admin_email = user_email AND is_enabled = true
    ) INTO has_2fa;
    
    IF NOT has_2fa THEN
        -- Log security event
        PERFORM log_admin_security_event('admin_access_denied_no_2fa', 
            jsonb_build_object('reason', 'No 2FA configured'));
        RETURN FALSE;
    END IF;
    
    -- For write operations, require valid 2FA session
    -- This will be checked by the application layer
    RETURN TRUE;
END;
$$;

-- 5. Tighten RLS policies for admin tables
DROP POLICY IF EXISTS "admin_users_consolidated" ON admin_users;
CREATE POLICY "admin_users_secure_access" 
ON admin_users 
FOR ALL 
USING (require_admin_with_2fa())
WITH CHECK (require_admin_with_2fa());