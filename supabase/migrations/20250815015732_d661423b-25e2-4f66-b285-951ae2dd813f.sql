-- Fix is_current_user_premium() to check session context first like get_current_user_tier_optimized() does
CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    session_tier TEXT;
    user_email TEXT;
    user_tier subscription_tier;
    is_admin BOOLEAN;
BEGIN
    -- Check session context first (for magic link users)
    BEGIN
        session_tier := current_setting('app.auth_tier', true);
        IF session_tier IS NOT NULL AND session_tier != '' AND session_tier IN ('premium', 'paid') THEN
            RETURN true;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is admin first
    is_admin := is_current_user_admin_fast();
    IF is_admin THEN
        RETURN true;
    END IF;
    
    -- Check beehiiv_subscribers table for premium tier
    SELECT subscription_tier INTO user_tier
    FROM public.beehiiv_subscribers
    WHERE email = user_email;
    
    -- Return true if premium or paid tier
    RETURN COALESCE(user_tier IN ('premium', 'paid'), false);
END;
$function$;

-- Create a function to check for any paid tier (premium or paid)
CREATE OR REPLACE FUNCTION public.is_current_user_paid()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    session_tier TEXT;
    user_email TEXT;
    user_tier subscription_tier;
    is_admin BOOLEAN;
BEGIN
    -- Check session context first (for magic link users)
    BEGIN
        session_tier := current_setting('app.auth_tier', true);
        IF session_tier IS NOT NULL AND session_tier != '' AND session_tier != 'free' THEN
            RETURN true;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is admin first
    is_admin := is_current_user_admin_fast();
    IF is_admin THEN
        RETURN true;
    END IF;
    
    -- Check beehiiv_subscribers table for any paid tier
    SELECT subscription_tier INTO user_tier
    FROM public.beehiiv_subscribers
    WHERE email = user_email;
    
    -- Return true for any tier that's not free
    RETURN COALESCE(user_tier != 'free', false);
END;
$function$;

-- Update get_current_user_email_optimized to better handle magic link session context
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    session_email TEXT;
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
    
    -- Check session context for magic link users
    BEGIN
        session_email := current_setting('app.current_user_email', true);
        IF session_email IS NOT NULL AND session_email != '' THEN
            RETURN session_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
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
    
    RETURN NULL;
END;
$function$;