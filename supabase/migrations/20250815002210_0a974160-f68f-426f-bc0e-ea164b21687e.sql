-- Update RLS policies to allow access for authenticated users without requiring Supabase sessions

-- Update telegram_messages policies to allow broader access for premium/paid users
DROP POLICY IF EXISTS "telegram_messages_tier_access" ON public.telegram_messages;
CREATE POLICY "telegram_messages_tier_access" 
ON public.telegram_messages FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Allow access if user has premium/paid tier (even without auth.uid)
  get_current_user_tier_optimized() = ANY(ARRAY['premium'::subscription_tier, 'paid'::subscription_tier])
);

-- Update chat_highlights policies 
DROP POLICY IF EXISTS "chat_highlights_tier_access" ON public.chat_highlights;
CREATE POLICY "chat_highlights_tier_access" 
ON public.chat_highlights FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Allow access if user has premium/paid tier
  get_current_user_tier_optimized() = ANY(ARRAY['premium'::subscription_tier, 'paid'::subscription_tier])
);

-- Update auto_highlights policies
DROP POLICY IF EXISTS "auto_highlights_tier_access" ON public.auto_highlights;
CREATE POLICY "auto_highlights_tier_access" 
ON public.auto_highlights FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Allow access if user has premium/paid tier
  get_current_user_tier_optimized() = ANY(ARRAY['premium'::subscription_tier, 'paid'::subscription_tier])
);

-- Update degen_call_subscriptions policies to be more permissive
DROP POLICY IF EXISTS "degen_call_subscriptions_enhanced_access" ON public.degen_call_subscriptions;
CREATE POLICY "degen_call_subscriptions_enhanced_access" 
ON public.degen_call_subscriptions FOR ALL 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Allow access based on email matching (works with any auth method)
  user_email = get_current_user_email_optimized()
)
WITH CHECK (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Allow access based on email matching
  user_email = get_current_user_email_optimized()
);