-- Update get_current_user_tier function to include Beehiiv API fallback
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_tier subscription_tier;
BEGIN
  -- Get current user email
  user_email := get_current_user_email();
  
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