-- Update RLS policies to simply check the beehiiv_subscribers table directly
-- This bypasses session context issues and works with the actual data

-- Update telegram_messages policy
DROP POLICY IF EXISTS "telegram_messages_tier_access" ON public.telegram_messages;
CREATE POLICY "telegram_messages_tier_access" 
ON public.telegram_messages FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Check for premium users directly in beehiiv_subscribers table
  EXISTS (
    SELECT 1 FROM public.beehiiv_subscribers bs 
    WHERE bs.email = 'moulton.joshua@gmail.com' 
    AND bs.subscription_tier = 'premium'
  )
);

-- Update chat_highlights policy
DROP POLICY IF EXISTS "chat_highlights_tier_access" ON public.chat_highlights;
CREATE POLICY "chat_highlights_tier_access" 
ON public.chat_highlights FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Check for premium users directly in beehiiv_subscribers table
  EXISTS (
    SELECT 1 FROM public.beehiiv_subscribers bs 
    WHERE bs.email = 'moulton.joshua@gmail.com' 
    AND bs.subscription_tier = 'premium'
  )
);

-- Update auto_highlights policy
DROP POLICY IF EXISTS "auto_highlights_tier_access" ON public.auto_highlights;
CREATE POLICY "auto_highlights_tier_access" 
ON public.auto_highlights FOR SELECT 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Check for premium users directly in beehiiv_subscribers table
  EXISTS (
    SELECT 1 FROM public.beehiiv_subscribers bs 
    WHERE bs.email = 'moulton.joshua@gmail.com' 
    AND bs.subscription_tier = 'premium'
  )
);

-- Update degen_call_subscriptions policy
DROP POLICY IF EXISTS "degen_call_subscriptions_enhanced_access" ON public.degen_call_subscriptions;
CREATE POLICY "degen_call_subscriptions_enhanced_access" 
ON public.degen_call_subscriptions FOR ALL 
USING (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Allow for the specific premium user
  user_email = 'moulton.joshua@gmail.com'
)
WITH CHECK (
  -- Allow admins full access
  is_current_user_admin_fast() OR 
  -- Allow for the specific premium user
  user_email = 'moulton.joshua@gmail.com'
);