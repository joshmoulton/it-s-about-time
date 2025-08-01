-- Update the is_current_user_admin function to exclude beta users
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.is_active = TRUE
    AND (
      -- Check via beehiiv subscriber
      (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND (beta_user IS FALSE OR beta_user IS NULL) -- Exclude beta users
      ))
      OR
      -- Check via direct email
      (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email'
       AND NOT EXISTS (
         SELECT 1 FROM public.beehiiv_subscribers 
         WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
         AND beta_user = TRUE -- Exclude if they are a beta user
       ))
    )
  );
END;
$$;