
-- Fix Function Volatility Issues by making functions STABLE where appropriate

-- Fix get_current_user_tier function
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier AS $$
BEGIN
  RETURN (
    SELECT bs.subscription_tier 
    FROM public.beehiiv_subscribers bs
    WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.is_active = TRUE
    AND (
      -- Check via beehiiv subscriber
      (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      ))
      OR
      -- Check via direct email
      (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
