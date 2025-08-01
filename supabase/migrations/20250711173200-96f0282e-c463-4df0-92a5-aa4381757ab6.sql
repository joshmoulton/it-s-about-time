-- Create missing authentication functions for enhanced auth

-- Function to validate password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Minimum 8 characters, at least one letter and one number
  RETURN length(password) >= 8 
    AND password ~ '[A-Za-z]' 
    AND password ~ '[0-9]';
END;
$$;

-- Function to hash password using pgcrypto
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- Function to verify password
CREATE OR REPLACE FUNCTION public.verify_password(email text, password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.beehiiv_subscribers
  WHERE beehiiv_subscribers.email = verify_password.email;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = crypt(password, stored_hash);
END;
$$;