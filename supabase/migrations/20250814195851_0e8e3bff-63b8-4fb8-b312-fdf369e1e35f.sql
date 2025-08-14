-- Create premium members tracking table
CREATE TABLE IF NOT EXISTS premium_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'premium',
  beehiiv_email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to check premium status
CREATE OR REPLACE FUNCTION is_premium()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM premium_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.active = true
      AND (pm.expires_at IS NULL OR pm.expires_at > now())
  );
$$;

-- Enable RLS on premium_members
ALTER TABLE premium_members ENABLE ROW LEVEL SECURITY;

-- Policy for premium_members table
CREATE POLICY "Users can view their own premium status"
ON premium_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin can manage all premium memberships
CREATE POLICY "Admins can manage premium memberships"
ON premium_members FOR ALL
TO authenticated
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Update RLS policies for premium access on telegram tables
DROP POLICY IF EXISTS "telegram_messages_premium_access" ON telegram_messages;
CREATE POLICY "telegram_messages_premium_access"
ON telegram_messages FOR SELECT
TO authenticated
USING (is_premium() OR is_current_user_admin_fast());

DROP POLICY IF EXISTS "telegram_topics_premium_access" ON telegram_topics;
CREATE POLICY "telegram_topics_premium_access"
ON telegram_topics FOR SELECT
TO authenticated
USING (is_premium() OR is_current_user_admin_fast());

DROP POLICY IF EXISTS "telegram_topic_mappings_premium_access" ON telegram_topic_mappings;
CREATE POLICY "telegram_topic_mappings_premium_access"
ON telegram_topic_mappings FOR SELECT
TO authenticated
USING (is_premium() OR is_current_user_admin_fast());

-- Update chat highlights for premium access
DROP POLICY IF EXISTS "chat_highlights_premium_and_paid_access" ON chat_highlights;
CREATE POLICY "chat_highlights_premium_access"
ON chat_highlights FOR SELECT
TO authenticated
USING (is_premium() OR is_current_user_admin_fast());

DROP POLICY IF EXISTS "auto_highlights_premium_and_paid_access" ON auto_highlights;
CREATE POLICY "auto_highlights_premium_access"
ON auto_highlights FOR SELECT
TO authenticated
USING (is_premium() OR is_current_user_admin_fast());