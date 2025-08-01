-- Fix infinite recursion in admin RLS policy by updating is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$

-- Remove beta mode system_settings if it exists
DELETE FROM public.system_settings WHERE setting_key = 'beta_mode';