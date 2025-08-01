-- Update get_current_user_tier() function to handle missing local data
-- Add fallback logic for when external verification succeeds but local storage is missing

CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
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

  -- **ENHANCED LOGIC**: First check for Whop authenticated users (highest priority)
  SELECT wau.subscription_tier INTO user_tier
  FROM public.whop_authenticated_users wau 
  WHERE wau.user_email = user_email;
  
  IF user_tier IS NOT NULL THEN
    RETURN user_tier;
  END IF;

  -- **ENHANCED LOGIC**: Then check beehiiv subscribers with better fallback
  SELECT bs.subscription_tier INTO user_tier
  FROM public.beehiiv_subscribers bs
  WHERE bs.email = user_email;
  
  IF user_tier IS NOT NULL THEN
    RETURN user_tier;
  END IF;

  -- **NEW FALLBACK**: Check if user has active session with verified tier
  -- This handles cases where external verification succeeded but local storage failed
  BEGIN
    SELECT us.tier::subscription_tier INTO user_tier
    FROM public.user_sessions us
    WHERE us.user_id = (
      SELECT id FROM public.beehiiv_subscribers 
      WHERE email = user_email 
      LIMIT 1
    )
    AND us.expires_at > now()
    AND us.tier != 'free'
    ORDER BY us.updated_at DESC
    LIMIT 1;
    
    IF user_tier IS NOT NULL THEN
      RETURN user_tier;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to default if session lookup fails
    NULL;
  END;

  -- If no tier found locally, default to free
  RETURN 'free'::subscription_tier;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.get_current_user_tier() IS 'Enhanced tier resolution with fallback logic for missing local data';

-- Add index to improve session lookup performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_tier_expires 
ON public.user_sessions (user_id, tier, expires_at DESC) 
WHERE expires_at > now() AND tier != 'free';