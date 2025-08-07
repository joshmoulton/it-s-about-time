-- Fix user_sessions table to handle duplicate sessions properly
-- Remove expired sessions first
DELETE FROM user_sessions 
WHERE expires_at < now();

-- Add a simple index for better performance on session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
ON user_sessions(expires_at) 
WHERE expires_at > now();