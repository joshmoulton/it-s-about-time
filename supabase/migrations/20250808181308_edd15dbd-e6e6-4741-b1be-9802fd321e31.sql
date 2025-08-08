-- Align telegram_messages policy with optimized tier function
DROP POLICY IF EXISTS "Premium users can view telegram messages" ON public.telegram_messages;
CREATE POLICY "Premium users can view telegram messages" 
ON public.telegram_messages 
FOR SELECT 
USING (
  (is_hidden = false) AND (
    get_current_user_tier_optimized() IN ('paid'::subscription_tier, 'premium'::subscription_tier)
    OR is_current_user_admin_fast()
  )
);