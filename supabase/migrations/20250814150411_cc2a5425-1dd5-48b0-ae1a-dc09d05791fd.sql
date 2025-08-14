-- Fix duplicate session constraint issue and improve session management
-- Drop the unique constraint that's causing issues for existing users
ALTER TABLE public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_unique;

-- Add a more flexible unique constraint that allows multiple sessions per user but prevents exact duplicates
-- We'll use a combination that allows multiple active sessions but prevents duplicate session tokens
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_unique ON public.user_sessions (session_token);

-- Update the session cleanup function to handle multiple sessions per user better
CREATE OR REPLACE FUNCTION public.cleanup_user_sessions(p_user_email text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_user_email IS NOT NULL THEN
    -- Clean expired sessions for specific user
    DELETE FROM user_sessions 
    WHERE subscriber_id = (
      SELECT id FROM beehiiv_subscribers WHERE email = p_user_email
    ) AND expires_at < now();
  ELSE
    -- Clean all expired sessions
    DELETE FROM user_sessions WHERE expires_at < now();
  END IF;
END;
$$;