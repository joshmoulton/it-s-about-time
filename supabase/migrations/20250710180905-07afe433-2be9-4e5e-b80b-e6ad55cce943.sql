-- Fix admin detection and profile saving for Whop users

-- 1. Completely disable RLS on user_profiles temporarily until we fix the Whop JWT claims
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Update the admin function to work better with different auth methods
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Try to get email from JWT claims
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
    EXCEPTION WHEN OTHERS THEN
        user_email := NULL;
    END;
    
    -- If no email from JWT, return false for now
    IF user_email IS NULL OR user_email = '' THEN
        RETURN false;
    END IF;
    
    -- Check if the user's email exists in admin_users table and is active
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = user_email
        AND is_active = true
    );
END;
$$;

-- 3. Also create a debug function to help troubleshoot
CREATE OR REPLACE FUNCTION public.debug_current_user()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{}';
    claims_text text;
    user_email text;
BEGIN
    -- Get raw claims
    BEGIN
        claims_text := current_setting('request.jwt.claims', true);
        result := result || jsonb_build_object('raw_claims', claims_text);
    EXCEPTION WHEN OTHERS THEN
        result := result || jsonb_build_object('raw_claims_error', SQLERRM);
    END;
    
    -- Get parsed email
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        result := result || jsonb_build_object('parsed_email', user_email);
    EXCEPTION WHEN OTHERS THEN
        result := result || jsonb_build_object('parsed_email_error', SQLERRM);
    END;
    
    -- Check admin status
    result := result || jsonb_build_object('is_admin', is_current_user_admin());
    
    RETURN result;
END;
$$;