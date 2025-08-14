-- Fix telegram_messages RLS policies - Remove ALL dependent policies first

-- Drop all policies that depend on the problematic functions
DROP POLICY IF EXISTS "analyst_signals_tier_read" ON public.analyst_signals;
DROP POLICY IF EXISTS "telegram_messages_premium_and_paid_access" ON public.telegram_messages;
DROP POLICY IF EXISTS "auto_highlights_premium_and_paid_access" ON public.auto_highlights;
DROP POLICY IF EXISTS "chat_highlights_premium_and_paid_access" ON public.chat_highlights;
DROP POLICY IF EXISTS "telegram_messages_admin_full_access" ON public.telegram_messages;
DROP POLICY IF EXISTS "telegram_messages_premium_paid_read" ON public.telegram_messages;

-- Now drop the problematic functions
DROP FUNCTION IF EXISTS public.is_magic_link_authenticated();
DROP FUNCTION IF EXISTS public.get_user_effective_tier();

-- Create simple, efficient RLS policies using existing optimized functions
CREATE POLICY "telegram_messages_admin_access" 
ON public.telegram_messages 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Create simple read policy for premium/paid users using existing tier function
CREATE POLICY "telegram_messages_tier_access" 
ON public.telegram_messages 
FOR SELECT 
USING (
  is_current_user_admin_fast() OR 
  get_current_user_tier_optimized() = ANY(ARRAY['paid'::subscription_tier, 'premium'::subscription_tier])
);

-- Recreate the analyst signals policy with simplified logic
CREATE POLICY "analyst_signals_tier_read" 
ON public.analyst_signals 
FOR SELECT 
USING (
  (status = 'active'::text) AND (
    is_current_user_admin_fast() OR 
    ((auth.uid() IS NOT NULL) AND get_current_user_tier_optimized() = ANY(ARRAY['paid'::subscription_tier, 'premium'::subscription_tier])) OR
    ((auth.uid() IS NOT NULL) AND (created_by = auth.uid()))
  )
);

-- Recreate the auto highlights policy with simplified logic  
CREATE POLICY "auto_highlights_premium_and_paid_access" 
ON public.auto_highlights 
FOR SELECT 
USING (
  is_current_user_admin_fast() OR 
  ((auth.uid() IS NOT NULL) AND get_current_user_tier_optimized() = ANY(ARRAY['paid'::subscription_tier, 'premium'::subscription_tier]))
);

-- Recreate the chat highlights policy with simplified logic
CREATE POLICY "chat_highlights_premium_and_paid_access" 
ON public.chat_highlights 
FOR SELECT 
USING (
  is_current_user_admin_fast() OR 
  ((auth.uid() IS NOT NULL) AND get_current_user_tier_optimized() = ANY(ARRAY['paid'::subscription_tier, 'premium'::subscription_tier]))
);

-- Add helpful indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_telegram_messages_timestamp ON public.telegram_messages (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_topic_name ON public.telegram_messages (topic_name);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_message_text ON public.telegram_messages USING gin(to_tsvector('english', message_text));
CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON public.telegram_messages (chat_id);