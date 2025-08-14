-- Remove unused 2FA admin tables and functions since 2FA is not used
DROP TABLE IF EXISTS public.admin_2fa_secrets CASCADE;
DROP TABLE IF EXISTS public.admin_2fa_sessions CASCADE;

-- Remove 2FA related functions
DROP FUNCTION IF EXISTS public.admin_has_2fa_enabled(text);
DROP FUNCTION IF EXISTS public.check_admin_with_2fa_session(text);
DROP FUNCTION IF EXISTS public.verify_2fa_session(text);
DROP FUNCTION IF EXISTS public.cleanup_expired_admin_sessions();

-- Fix search path for functions to be immutable
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(email text, password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.beehiiv_subscribers
  WHERE beehiiv_subscribers.email = verify_password.email;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = crypt(password, stored_hash);
END;
$$;

-- Tighten RLS policies for sensitive tables

-- Ensure beehiiv_subscribers email data is properly protected
DROP POLICY IF EXISTS "Users can view their own subscriber data" ON public.beehiiv_subscribers;
CREATE POLICY "Users can view their own subscriber data" 
ON public.beehiiv_subscribers 
FOR SELECT 
USING (
  email = get_current_user_email_optimized() OR 
  is_current_user_admin_fast()
);

-- Restrict access to admin audit logs to super admins only
DROP POLICY IF EXISTS "audit_log_admin_read" ON public.admin_audit_log;
CREATE POLICY "audit_log_admin_read" 
ON public.admin_audit_log 
FOR SELECT 
USING (has_admin_role('super_admin'::text));

-- Restrict sensitive admin security events
DROP POLICY IF EXISTS "admin_security_events_unified" ON public.admin_security_events;
CREATE POLICY "admin_security_events_admin_only" 
ON public.admin_security_events 
FOR ALL 
USING (has_admin_role('super_admin'::text))
WITH CHECK (has_admin_role('super_admin'::text));

-- Remove any potential user profiles exposure if not needed
-- (This appears to be a security warning about a user_profiles table)
-- If you have such a table and it's not needed, consider dropping it
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Update cleanup function to remove 2FA references
CREATE OR REPLACE FUNCTION public.cleanup_all_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Clean up expired user sessions
    DELETE FROM user_sessions 
    WHERE expires_at < now();
    
    -- Clean up expired secure sessions
    DELETE FROM admin_secure_sessions 
    WHERE expires_at < now() OR (last_activity_at < now() - INTERVAL '24 hours');
    
    -- Clean up old rate limit entries
    DELETE FROM auth_rate_limits 
    WHERE window_start < now() - INTERVAL '24 hours';
    
    -- Reset blocked entries past their block time
    UPDATE auth_rate_limits 
    SET blocked_until = NULL 
    WHERE blocked_until IS NOT NULL AND blocked_until < now();
    
    -- Clean up old authentication audit logs (keep 90 days)
    DELETE FROM authentication_audit_log 
    WHERE created_at < now() - INTERVAL '90 days';
END;
$$;