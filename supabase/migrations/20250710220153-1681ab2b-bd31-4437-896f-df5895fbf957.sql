-- Fix the is_current_user_admin function to properly scope admin access
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
    -- Get auth.uid() first
    auth_uid := auth.uid();
    
    -- If we have a Supabase auth user, use their email
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = auth_uid;
        IF user_email IS NOT NULL THEN
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email AND is_active = true
            );
        END IF;
    END IF;
    
    -- Try JWT claims approach for Whop users
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email AND is_active = true
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Continue to next method
        NULL;
    END;
    
    -- Check session-based authentication
    BEGIN
        user_email := current_setting('app.current_user_email', true);
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email AND is_active = true
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- No fallback - only users in admin_users table should have admin access
    RETURN FALSE;
END;
$$;