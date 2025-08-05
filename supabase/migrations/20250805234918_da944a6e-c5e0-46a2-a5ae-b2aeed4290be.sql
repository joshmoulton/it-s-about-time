-- Fix get_current_user_email_optimized function to properly return user email
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- First try to get email from auth metadata
  IF auth.uid() IS NOT NULL THEN
    RETURN COALESCE(
      auth.email(),
      (auth.jwt() ->> 'email')::text
    );
  END IF;
  
  RETURN NULL;
END;
$$;

-- Also update get_current_user_tier to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_tier subscription_tier;
  admin_override TEXT;
BEGIN
  -- Get current user email using optimized function
  user_email := get_current_user_email_optimized();
  
  -- Debug: Log what we get
  RAISE LOG 'get_current_user_tier: user_email=%, auth.uid()=%, auth.email()=%', 
    user_email, auth.uid(), auth.email();
  
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
  
  -- Use auth.email() directly if get_current_user_email_optimized returns null
  IF user_email IS NULL THEN
    user_email := auth.email();
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