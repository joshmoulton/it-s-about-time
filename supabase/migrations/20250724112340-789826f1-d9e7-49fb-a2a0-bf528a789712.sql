-- Critical Security Fix 1: Enable RLS on exposed tables
ALTER TABLE public.telegram_messages_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_topic_mappings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for telegram_messages_backup
CREATE POLICY "telegram_messages_backup_admin_access" 
ON public.telegram_messages_backup 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Add RLS policies for telegram_topic_mappings  
CREATE POLICY "telegram_topic_mappings_admin_access" 
ON public.telegram_topic_mappings 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Critical Security Fix 2: Add missing search_path to database functions
-- Update hash_password function
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- Update verify_password function
CREATE OR REPLACE FUNCTION public.verify_password(email text, password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Minimum 8 characters, at least one letter and one number
  RETURN length(password) >= 8 
    AND password ~ '[A-Za-z]' 
    AND password ~ '[0-9]';
END;
$$;