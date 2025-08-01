
-- Additional SQL functions needed for the enhanced auth system

CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(email text, password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.beehiiv_subscribers
  WHERE beehiiv_subscribers.email = verify_password.email;
  
  RETURN stored_hash IS NOT NULL AND stored_hash = crypt(password, stored_hash);
END;
$$;
