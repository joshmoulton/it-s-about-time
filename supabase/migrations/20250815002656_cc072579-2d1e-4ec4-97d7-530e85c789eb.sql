-- Create a function to set configuration values for RLS policies
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, new_value text, is_local boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use pg_catalog.set_config to set session variables
  PERFORM pg_catalog.set_config(setting_name, new_value, is_local);
END;
$$;

-- Update the get_current_user_email_optimized function to check session variables
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
BEGIN
    -- Check session context first (for magic link users)
    BEGIN
        user_email := current_setting('app.user_email', true);
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Check Supabase Auth user
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
        NULL;
    END;
    
    RETURN NULL;
END;
$function$;

-- Update the get_current_user_tier_optimized function to check session variables
CREATE OR REPLACE FUNCTION public.get_current_user_tier_optimized()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    user_tier subscription_tier;
    session_tier TEXT;
    is_admin BOOLEAN;
BEGIN
    -- Check session context first (for magic link users)
    BEGIN
        session_tier := current_setting('app.auth_tier', true);
        IF session_tier IS NOT NULL AND session_tier != '' AND session_tier != 'free' THEN
            RETURN session_tier::subscription_tier;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN 'free'::subscription_tier;
    END IF;
    
    -- Check if user is admin first
    is_admin := is_current_user_admin_fast();
    IF is_admin THEN
        RETURN 'premium'::subscription_tier;
    END IF;
    
    -- Check beehiiv_subscribers table for tier
    SELECT subscription_tier INTO user_tier
    FROM public.beehiiv_subscribers
    WHERE email = user_email;
    
    -- Return found tier or default to free
    RETURN COALESCE(user_tier, 'free'::subscription_tier);
END;
$function$;