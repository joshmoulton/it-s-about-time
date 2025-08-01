-- Update the admin check function to recognize Whop authenticated users
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_email text;
BEGIN
  -- Get the current user's email from JWT claims
  current_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  IF current_email IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.is_active = TRUE
    AND (
      -- Check via direct email (for Supabase admins)
      (au.email IS NOT NULL AND au.email = current_email)
      OR
      -- Check via beehiiv subscriber (for subscriber-linked admins)
      (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_email
      ))
      OR
      -- NEW: Check if Whop authenticated user's email matches any admin email
      (EXISTS (
        SELECT 1 FROM public.whop_authenticated_users wau
        WHERE wau.user_email = current_email
        AND EXISTS (
          SELECT 1 FROM public.admin_users au2 
          WHERE au2.is_active = TRUE 
          AND (au2.email = current_email OR 
               au2.subscriber_id = (SELECT id FROM public.beehiiv_subscribers WHERE email = current_email))
        )
      ))
    )
  );
END;
$function$;