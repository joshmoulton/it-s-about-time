-- Fix get_current_user_email function to properly handle Supabase auth sessions
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
BEGIN
    -- First, try to get email from Supabase Auth user (most reliable)
    auth_uid := auth.uid();
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = auth_uid;
        
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    END IF;
    
    -- Fall back to JWT claims for Whop users with improved parsing
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed, continue to next method
        NULL;
    END;
    
    -- Try alternative JWT claim extraction
    BEGIN
        user_email := current_setting('request.jwt.claim.email', true);
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Check app setting as last resort
    BEGIN
        user_email := current_setting('app.current_user_email', true);
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    RETURN NULL;
END;
$$;

-- Update is_current_user_admin to use optimized email function
CREATE OR REPLACE FUNCTION public.is_current_user_admin_fast()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
BEGIN
    -- First check if we have a Supabase auth user
    auth_uid := auth.uid();
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = auth_uid;
        IF user_email IS NOT NULL THEN
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email AND is_active = true
            );
        END IF;
    END IF;
    
    -- Use optimized email function for other cases
    user_email := get_current_user_email_optimized();
    IF user_email IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE email = user_email AND is_active = true
        );
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Update get_current_user_tier to handle super admin override and fix email detection
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_tier subscription_tier;
  admin_override TEXT;
BEGIN
  -- Get current user email using optimized function
  user_email := get_current_user_email_optimized();
  
  -- If user is super admin, check for tier override setting
  IF is_current_user_admin_fast() THEN
    -- Check if there's an admin tier override setting
    BEGIN
      SELECT setting_value->>'tier' INTO admin_override
      FROM public.system_settings 
      WHERE setting_key = 'admin_tier_override';
      
      IF admin_override IS NOT NULL THEN
        RETURN admin_override::subscription_tier;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
    -- Super admins default to premium if no override
    RETURN 'premium'::subscription_tier;
  END IF;
  
  IF user_email IS NULL THEN
    RETURN 'free'::subscription_tier;
  END IF;

  -- First check for Whop authenticated users (highest priority)
  SELECT wau.subscription_tier INTO user_tier
  FROM public.whop_authenticated_users wau 
  WHERE wau.user_email = user_email;
  
  IF user_tier IS NOT NULL THEN
    RETURN user_tier;
  END IF;

  -- Then check beehiiv subscribers
  SELECT bs.subscription_tier INTO user_tier
  FROM public.beehiiv_subscribers bs
  WHERE bs.email = user_email;
  
  IF user_tier IS NOT NULL THEN
    RETURN user_tier;
  END IF;

  -- If no tier found locally, default to free
  RETURN 'free'::subscription_tier;
END;
$$;

-- Create function to set admin tier override (super admin only)
CREATE OR REPLACE FUNCTION public.set_admin_tier_override(override_tier subscription_tier)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super admins can set tier override
  IF NOT (is_current_user_admin_fast() AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = get_current_user_email_optimized() 
    AND role = 'super_admin' 
    AND is_active = true
  )) THEN
    RAISE EXCEPTION 'Access denied: Super admin access required';
  END IF;
  
  -- Insert or update the override setting
  INSERT INTO public.system_settings (setting_key, setting_value, description)
  VALUES (
    'admin_tier_override',
    jsonb_build_object('tier', override_tier::text),
    'Admin tier override for testing different user experiences'
  )
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = jsonb_build_object('tier', override_tier::text),
    updated_at = now();
END;
$$;

-- Create function to clear admin tier override
CREATE OR REPLACE FUNCTION public.clear_admin_tier_override()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super admins can clear tier override
  IF NOT (is_current_user_admin_fast() AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = get_current_user_email_optimized() 
    AND role = 'super_admin' 
    AND is_active = true
  )) THEN
    RAISE EXCEPTION 'Access denied: Super admin access required';
  END IF;
  
  DELETE FROM public.system_settings 
  WHERE setting_key = 'admin_tier_override';
END;
$$;