-- Fix admin detection for both Supabase Auth and Whop users
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
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
            -- Check if this email is an admin
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email
                AND is_active = true
            );
        END IF;
    END IF;
    
    -- Fall back to JWT claims for Whop users
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email
                AND is_active = true
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If JWT parsing fails, return false
        RETURN false;
    END;
    
    RETURN false;
END;
$$;