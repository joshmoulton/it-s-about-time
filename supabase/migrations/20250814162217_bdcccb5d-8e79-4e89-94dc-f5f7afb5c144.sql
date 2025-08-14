-- Create function to check if user is authenticated via magic link
CREATE OR REPLACE FUNCTION public.is_magic_link_authenticated()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    auth_method TEXT;
BEGIN
    -- Check localStorage auth method (stored by magic link system)
    auth_method := current_setting('app.auth_method', true);
    
    -- If no app setting, check if we have a valid auth session
    IF auth_method IS NULL THEN
        RETURN auth.uid() IS NOT NULL;
    END IF;
    
    RETURN auth_method = 'magic_link';
END;
$function$;

-- Create function to get effective user tier (combining multiple auth sources)
CREATE OR REPLACE FUNCTION public.get_user_effective_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    user_tier subscription_tier;
    auth_tier TEXT;
BEGIN
    -- First check if user is admin
    IF is_current_user_admin_fast() THEN
        RETURN 'premium'::subscription_tier;
    END IF;
    
    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    -- If no email found, check localStorage auth tier
    IF user_email IS NULL THEN
        auth_tier := current_setting('app.auth_tier', true);
        IF auth_tier IS NOT NULL THEN
            CASE auth_tier
                WHEN 'free' THEN RETURN 'free'::subscription_tier;
                WHEN 'paid' THEN RETURN 'paid'::subscription_tier;
                WHEN 'premium' THEN RETURN 'premium'::subscription_tier;
                ELSE RETURN 'free'::subscription_tier;
            END CASE;
        END IF;
        RETURN 'free'::subscription_tier;
    END IF;
    
    -- Check beehiiv_subscribers table for tier
    SELECT subscription_tier INTO user_tier
    FROM public.beehiiv_subscribers
    WHERE email = user_email;
    
    -- Return found tier or check localStorage as fallback
    IF user_tier IS NOT NULL THEN
        RETURN user_tier;
    END IF;
    
    -- Fallback to localStorage auth tier
    auth_tier := current_setting('app.auth_tier', true);
    IF auth_tier IS NOT NULL THEN
        CASE auth_tier
            WHEN 'free' THEN RETURN 'free'::subscription_tier;
            WHEN 'paid' THEN RETURN 'paid'::subscription_tier;
            WHEN 'premium' THEN RETURN 'premium'::subscription_tier;
            ELSE RETURN 'free'::subscription_tier;
        END CASE;
    END IF;
    
    RETURN 'free'::subscription_tier;
END;
$function$;