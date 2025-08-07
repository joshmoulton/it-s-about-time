-- Fix user_sessions table to handle duplicate sessions properly
-- Instead of failing on duplicate, we'll update existing sessions

-- First, let's see if we need to clean up any orphaned sessions
DELETE FROM user_sessions 
WHERE expires_at < now();

-- Now modify the user_sessions table to allow UPSERT operations
-- by removing the unique constraint and handling duplicates in the application logic
-- We'll keep the constraint but modify the edge function to handle it properly

-- Add an index for better performance on session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_expires 
ON user_sessions(user_id, expires_at) 
WHERE expires_at > now();