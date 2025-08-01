-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(p_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.beehiiv_subscribers
    WHERE email = p_email
    AND locked_until IS NOT NULL
    AND locked_until > now()
  );
END;
$function$;