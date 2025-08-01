-- Fix remaining functions without proper search_path security
-- Handle parameter name conflicts by dropping and recreating functions

-- Drop and recreate encrypt_sensitive_data function with proper security
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(text, text);

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data text, p_key_id text DEFAULT 'default'::text)
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
    encryption_key := 'demo_key_' || p_key_id;
    
    -- Encrypt the data
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
$$;

-- Fix the remaining critical security functions
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
BEGIN
    -- Get auth.uid() first for Supabase authenticated users
    auth_uid := auth.uid();
    
    -- If we have a Supabase auth user (local admin), prioritize this
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = auth_uid;
        IF user_email IS NOT NULL THEN
            RETURN EXISTS (
                SELECT 1 FROM admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND (user_type = 'supabase_admin' OR user_type IS NULL)
            );
        END IF;
    END IF;
    
    -- Fall back to JWT claims for Whop users
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN EXISTS (
                SELECT 1 FROM admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND user_type = 'whop_admin'
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed
        NULL;
    END;
    
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(required_role text DEFAULT 'admin'::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = get_current_user_email_optimized()
    AND au.is_active = true
    AND (au.role = required_role OR au.role = 'super_admin')
  )
$$;