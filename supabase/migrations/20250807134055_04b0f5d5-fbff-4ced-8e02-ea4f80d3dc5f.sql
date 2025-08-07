-- First, let's check the current structure and add the missing unique constraint
-- The issue is that the user_sessions table needs a unique constraint on user_id or session_token
-- for the ON CONFLICT clause to work properly

-- Check if there's already a constraint on session_token
SELECT constraint_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'user_sessions' 
AND constraint_name IN (
  SELECT constraint_name 
  FROM information_schema.table_constraints 
  WHERE table_name = 'user_sessions' 
  AND constraint_type = 'UNIQUE'
);

-- Add unique constraint on session_token if it doesn't exist
DO $$
BEGIN
  -- Check if unique constraint on session_token exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_sessions' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%session_token%'
  ) THEN
    ALTER TABLE public.user_sessions 
    ADD CONSTRAINT user_sessions_session_token_unique UNIQUE (session_token);
  END IF;
END $$;

-- Also add a unique constraint on user_id to handle the user-specific sessions
DO $$
BEGIN
  -- Check if unique constraint on user_id exists  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_sessions' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%user_id%'
  ) THEN
    ALTER TABLE public.user_sessions 
    ADD CONSTRAINT user_sessions_user_id_unique UNIQUE (user_id);
  END IF;
END $$;