-- Fix Auth RLS Initialization Plan issues by creating security definer functions
-- and updating RLS policies to use them instead of direct auth calls

-- Create helper functions for common auth operations
CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.get_jwt_email()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'email',
    ''
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_beehiiv_subscriber_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.beehiiv_subscribers 
  WHERE email = get_jwt_email()
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.has_admin_role(required_role text DEFAULT 'admin')
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
    WHERE bs.email = get_jwt_email()
    AND au.is_active = true
    AND (au.role = required_role OR au.role = 'super_admin')
  )
$function$;

CREATE OR REPLACE FUNCTION public.user_has_premium_tier()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.beehiiv_subscribers
    WHERE email = get_jwt_email()
    AND subscription_tier = 'premium'
  )
$function$;

CREATE OR REPLACE FUNCTION public.user_has_paid_tier()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.beehiiv_subscribers
    WHERE email = get_jwt_email()
    AND subscription_tier IN ('paid', 'premium')
  )
$function$;