-- Create or fix the get_current_user_email_optimized function
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS text AS $$
DECLARE
    user_email text;
BEGIN
    -- First, try to get email from Supabase Auth user
    IF auth.uid() IS NOT NULL THEN
        SELECT au.email INTO user_email 
        FROM auth.users au 
        WHERE au.id = auth.uid();
        
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;