-- Update the is_current_user_admin function to properly handle local Supabase admin users
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
            -- For local admin users, check admin_users table
            -- Only allow supabase_admin type for security (no whop_admin via local login)
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND (user_type = 'supabase_admin' OR user_type IS NULL)
            );
        END IF;
    END IF;
    
    -- Try JWT claims approach for Whop users (should not have admin access)
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        IF user_email IS NOT NULL AND user_email != '' THEN
            -- For Whop users, deny admin access for security
            -- This ensures only local Supabase users can be admins
            RETURN FALSE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Continue to next method
        NULL;
    END;
    
    -- Check session-based authentication (legacy support)
    BEGIN
        user_email := current_setting('app.current_user_email', true);
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND (user_type = 'supabase_admin' OR user_type IS NULL)
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- No admin access granted
    RETURN FALSE;
END;
$$;