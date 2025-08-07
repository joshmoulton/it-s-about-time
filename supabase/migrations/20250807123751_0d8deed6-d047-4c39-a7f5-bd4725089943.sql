-- Fix remaining function search path security issues

-- Fix get_current_user_email_optimized function
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_email TEXT;
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
    IF current_setting('app.current_user_email_optimized', true) IS NOT NULL THEN
        RETURN current_setting('app.current_user_email_optimized', true);
    END IF;
    
    RETURN NULL;
END;
$function$;

-- Fix update_telegram_topic_mappings_update function
CREATE OR REPLACE FUNCTION public.update_telegram_topic_mappings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Also fix any other functions that might be missing search paths
CREATE OR REPLACE FUNCTION public.can_manage_admin_role(target_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Get the current user's role
    SELECT role INTO current_user_role
    FROM admin_users 
    WHERE email = get_current_user_email_optimized() 
    AND is_active = true;
    
    -- Super admins can manage any role
    IF current_user_role = 'super_admin' THEN
        RETURN true;
    END IF;
    
    -- Regular admins can only manage regular admin roles (not super_admin)
    IF current_user_role = 'admin' AND target_role != 'super_admin' THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$;

-- Fix get_beehiiv_subscriber_id function if it exists
CREATE OR REPLACE FUNCTION public.get_beehiiv_subscriber_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    subscriber_id UUID;
    user_email TEXT;
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT id INTO subscriber_id
    FROM beehiiv_subscribers
    WHERE email = user_email;
    
    RETURN subscriber_id;
END;
$function$;

-- Fix get_current_user_tier function
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
 RETURNS subscription_tier
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_tier subscription_tier;
    user_email TEXT;
    tier_override jsonb;
BEGIN
    -- Check for admin tier override first
    SELECT setting_value INTO tier_override
    FROM system_settings
    WHERE setting_key = 'admin_tier_override';
    
    IF tier_override IS NOT NULL AND is_current_user_admin_fast() THEN
        RETURN (tier_override->>'tier')::subscription_tier;
    END IF;
    
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN 'free'::subscription_tier;
    END IF;
    
    -- Check beehiiv_subscribers table
    SELECT subscription_tier INTO user_tier
    FROM beehiiv_subscribers
    WHERE email = user_email;
    
    RETURN COALESCE(user_tier, 'free'::subscription_tier);
END;
$function$;