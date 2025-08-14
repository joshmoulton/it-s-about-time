-- Fix telegram_messages RLS policies to use proper tier checking
-- Drop the problematic policies first
DROP POLICY IF EXISTS "telegram_messages_authenticated_premium_users" ON telegram_messages;
DROP POLICY IF EXISTS "telegram_messages_premium_access" ON telegram_messages;

-- Create a proper RLS policy for telegram_messages
CREATE POLICY "telegram_messages_tier_access" 
ON telegram_messages 
FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR
  -- Allow premium/paid tier users
  (
    auth.uid() IS NOT NULL AND 
    get_current_user_tier_optimized() IN ('premium', 'paid')
  )
);

-- Also create policy for auto_highlights to work with telegram messages
DROP POLICY IF EXISTS "auto_highlights_authenticated_read" ON auto_highlights;
CREATE POLICY "auto_highlights_tier_access" 
ON auto_highlights 
FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR
  -- Allow premium/paid tier users
  (
    auth.uid() IS NOT NULL AND 
    get_current_user_tier_optimized() IN ('premium', 'paid')
  )
);

-- Fix chat_highlights policy too
DROP POLICY IF EXISTS "chat_highlights_authenticated_read" ON chat_highlights;
CREATE POLICY "chat_highlights_tier_access" 
ON chat_highlights 
FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR
  -- Allow premium/paid tier users
  (
    auth.uid() IS NOT NULL AND 
    get_current_user_tier_optimized() IN ('premium', 'paid')
  )
);