-- Fix security linter warning by setting proper search_path for all functions
-- Update functions to have immutable search_path settings

-- Fix get_current_user_email_optimized function
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS TEXT 
LANGUAGE plpgsql 
STABLE SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
    jwt_email TEXT;
BEGIN
    -- Get auth.uid() once and store it
    auth_uid := auth.uid();
    
    -- If we have a Supabase auth user, use their email directly
    IF auth_uid IS NOT NULL THEN
        SELECT u.email INTO user_email 
        FROM auth.users u 
        WHERE u.id = auth_uid;
        
        IF user_email IS NOT NULL THEN
            RETURN user_email;
        END IF;
    END IF;
    
    -- Fall back to JWT claims for Whop users
    BEGIN
        jwt_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF jwt_email IS NOT NULL AND jwt_email != '' THEN
            RETURN jwt_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed, continue to other methods
        NULL;
    END;
    
    -- Alternative approach: check app setting that might be set by enhanced auth
    BEGIN
        IF current_setting('app.current_user_email', true) IS NOT NULL THEN
            RETURN current_setting('app.current_user_email', true);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Return null if no user found
    RETURN NULL;
END;
$$;