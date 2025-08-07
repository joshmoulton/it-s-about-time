-- Phase 2: Database Security Hardening

-- First, let's secure all database functions by setting explicit search paths
-- This prevents schema poisoning attacks

-- Update existing security-sensitive functions with explicit search paths
CREATE OR REPLACE FUNCTION public.get_current_user_email()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
    
    -- Alternative approach: check app setting
    IF current_setting('app.current_user_email', true) IS NOT NULL THEN
        RETURN current_setting('app.current_user_email', true);
    END IF;
    
    RETURN NULL;
END;
$function$;

-- Update is_current_user_admin function with proper search path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_email TEXT;
    is_admin BOOLEAN := FALSE;
BEGIN
    user_email := get_current_user_email();
    
    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is in admin_users table
    SELECT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = user_email 
        AND is_active = true
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$function$;

-- Fix the overly permissive RLS policy on beehiiv_subscribers
-- Drop the problematic policy
DROP POLICY IF EXISTS "System can manage subscriber data" ON public.beehiiv_subscribers;

-- Create a more secure policy for system operations
CREATE POLICY "Secure system operations" 
ON public.beehiiv_subscribers 
FOR ALL 
USING (
  -- Only allow system operations for authenticated admin users or service role
  (auth.jwt() ->> 'role' = 'service_role') OR 
  (is_current_user_admin() = true)
)
WITH CHECK (
  -- Same check for inserts/updates
  (auth.jwt() ->> 'role' = 'service_role') OR 
  (is_current_user_admin() = true)
);

-- Update sanitize_user_input function with proper security
CREATE OR REPLACE FUNCTION public.sanitize_user_input(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = 'public'
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
    
    -- Limit input length to prevent DoS
    input_text := substring(input_text from 1 for 2000);
    
    -- Trim whitespace
    input_text := trim(input_text);
    
    RETURN input_text;
END;
$function$;

-- Create a secure email validation function
CREATE OR REPLACE FUNCTION public.validate_email_secure(email_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = 'public'
AS $function$
BEGIN
    IF email_input IS NULL OR length(email_input) = 0 THEN
        RETURN false;
    END IF;
    
    -- Basic email validation with security checks
    IF length(email_input) > 254 THEN -- RFC 5321 limit
        RETURN false;
    END IF;
    
    -- Check for basic email format
    IF email_input !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN false;
    END IF;
    
    -- Security checks for malicious patterns
    IF email_input ~* '(script|javascript|vbscript|onload|onerror)' THEN
        RETURN false;
    END IF;
    
    -- Check for consecutive dots (security issue)
    IF email_input LIKE '%..%' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$function$;

-- Update all other security-sensitive functions with explicit search paths
CREATE OR REPLACE FUNCTION public.is_current_user_admin_fast()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = get_current_user_email()
    AND au.is_active = true
  )
$function$;

-- Create audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_email TEXT;
    operation_details jsonb;
BEGIN
    user_email := COALESCE(get_current_user_email(), 'system');
    
    -- Build operation details
    operation_details := jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW(),
        'user_email', user_email,
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    );
    
    -- Only log if it's a sensitive operation on user data
    IF TG_TABLE_NAME IN ('beehiiv_subscribers', 'admin_users', 'encrypted_user_data') THEN
        INSERT INTO admin_audit_log (
            action,
            resource,
            resource_id,
            user_email,
            metadata
        ) VALUES (
            LOWER(TG_OP),
            TG_TABLE_NAME,
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
                ELSE COALESCE(NEW.id::TEXT, 'unknown')
            END,
            user_email,
            operation_details
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;