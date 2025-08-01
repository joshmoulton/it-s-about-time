-- Enable realtime for telegram_messages table
ALTER TABLE telegram_messages REPLICA IDENTITY FULL;

-- Update telegram_topics RLS policy to allow all authenticated users to view topics
DROP POLICY IF EXISTS "Premium users can view telegram topics" ON telegram_topics;

CREATE POLICY "Authenticated users can view active telegram topics"
ON telegram_topics FOR SELECT
TO authenticated
USING (is_active = true);

-- Check if policy exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'telegram_messages' 
    AND policyname = 'Authenticated users can view telegram messages'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view telegram messages" ON telegram_messages FOR SELECT TO authenticated USING (is_hidden = false)';
  END IF;
END $$;