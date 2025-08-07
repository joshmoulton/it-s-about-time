-- Fix cleanup function to use correct column names
CREATE OR REPLACE FUNCTION public.cleanup_user_sessions_for_email(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer;
  result jsonb;
BEGIN
  -- Delete all sessions for the given email
  DELETE FROM user_sessions 
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = p_email
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  result := jsonb_build_object(
    'success', true,
    'email', p_email,
    'deleted_sessions', deleted_count,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;