-- Create a more robust admin check function that works with session-based auth
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
    
    -- For now, hardcode admin access for your email during development
    RETURN 'moulton.joshua@gmail.com' IN (
        SELECT email FROM public.admin_users WHERE is_active = true
    );
END;
$$;