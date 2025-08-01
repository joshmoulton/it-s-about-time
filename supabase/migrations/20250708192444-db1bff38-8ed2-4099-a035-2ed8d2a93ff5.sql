-- Fix Amy's beta access data and investigate the get_current_user_tier function
-- First, fix Amy's account
UPDATE public.beehiiv_subscribers 
SET 
  beta_access_granted = true,
  beta_user = true,
  beta_access_expires_at = now() + INTERVAL '30 days',
  updated_at = now()
WHERE email = 'amy.answers31@gmail.com';

-- Also fix the get_current_user_tier function to handle beta users properly
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First check for Whop authenticated users (highest priority)
  IF EXISTS (
    SELECT 1 FROM public.whop_authenticated_users wau 
    WHERE wau.user_email = current_setting('request.jwt.claims', true)::json->>'email'
  ) THEN
    RETURN (
      SELECT wau.subscription_tier 
      FROM public.whop_authenticated_users wau
      WHERE wau.user_email = current_setting('request.jwt.claims', true)::json->>'email'
      LIMIT 1
    );
  END IF;

  -- Then check beehiiv subscribers (includes beta users)
  RETURN (
    SELECT bs.subscription_tier 
    FROM public.beehiiv_subscribers bs
    WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
    LIMIT 1
  );
END;
$$;

-- Verify Amy's data is now correct
SELECT 
  email,
  subscription_tier,
  beta_access_granted,
  beta_user,
  beta_access_expires_at,
  public.get_current_user_tier() as calculated_tier
FROM public.beehiiv_subscribers 
WHERE email = 'amy.answers31@gmail.com';