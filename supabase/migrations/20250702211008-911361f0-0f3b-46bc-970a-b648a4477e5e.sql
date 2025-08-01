-- Enable realtime for telegram_messages table
ALTER TABLE telegram_messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
DO $$
BEGIN
  BEGIN
    INSERT INTO supabase_realtime.subscription VALUES ('supabase_realtime', 'public', 'telegram_messages', 'INSERT,UPDATE,DELETE', true);
  EXCEPTION WHEN unique_violation THEN
    -- Table already subscribed, just ensure it's enabled
    UPDATE supabase_realtime.subscription 
    SET enabled = true 
    WHERE subscription_name = 'supabase_realtime' 
    AND schema_name = 'public' 
    AND table_name = 'telegram_messages';
  END;
END $$;

-- Update telegram_topics RLS policy to allow all authenticated users to view topics
DROP POLICY IF EXISTS "Premium users can view telegram topics" ON telegram_topics;

CREATE POLICY "Authenticated users can view active telegram topics"
ON telegram_topics FOR SELECT
TO authenticated
USING (is_active = true);

-- Also update telegram_messages RLS to ensure all authenticated users can see messages
CREATE POLICY IF NOT EXISTS "Authenticated users can view telegram messages"
ON telegram_messages FOR SELECT
TO authenticated
USING (is_hidden = false);