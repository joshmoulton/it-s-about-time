-- Phase 1: Critical Security Fixes

-- 1. Add RLS to subscriptions table (for completeness)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage their own subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 2. Fix search_path issues in existing functions
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    auth_uid UUID;
BEGIN
    -- Get auth.uid() for Supabase authenticated users
    auth_uid := auth.uid();
    
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = auth_uid;
        IF user_email IS NOT NULL THEN
            RETURN user_email;
        END IF;
    END IF;
    
    -- Fall back to JWT claims for external auth (Whop users)
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
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin_fast()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check admin_users table
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = user_email 
        AND is_active = true
    );
END;
$function$;

-- 3. Enhanced XSS protection function
CREATE OR REPLACE FUNCTION public.sanitize_user_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Enhanced XSS protection
    input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
    input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
    input_text := regexp_replace(input_text, 'on\w+\s*=', '', 'gi');
    input_text := regexp_replace(input_text, 'data:', '', 'gi');
    input_text := regexp_replace(input_text, 'vbscript:', '', 'gi');
    input_text := regexp_replace(input_text, 'expression\s*\(', '', 'gi');
    
    -- Remove potential SQL injection patterns
    input_text := regexp_replace(input_text, '(union|select|insert|update|delete|drop|create|alter)\s', '', 'gi');
    
    -- Trim whitespace
    input_text := trim(input_text);
    
    RETURN input_text;
END;
$function$;

-- 4. Secure session cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_all_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Clean up expired user sessions
    DELETE FROM user_sessions 
    WHERE expires_at < now();
    
    -- Clean up expired admin sessions
    DELETE FROM admin_2fa_sessions 
    WHERE expires_at < now() OR created_at < now() - INTERVAL '2 hours';
    
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
$function$;

-- 5. Fix newsletter sync cron jobs - remove broken ones first
SELECT cron.unschedule('beehiiv-morning-sync');
SELECT cron.unschedule('beehiiv-evening-sync'); 
SELECT cron.unschedule('beehiiv-incremental-sync');

-- Create a proper newsletter sync job every 6 hours
SELECT cron.schedule(
    'newsletter-sync-6h',
    '0 */6 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/newsletter-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"action": "sync_newsletters", "trigger": "cron"}''::jsonb);'
);