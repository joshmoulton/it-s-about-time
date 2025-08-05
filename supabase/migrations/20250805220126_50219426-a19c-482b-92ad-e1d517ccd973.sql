-- Fix ambiguous user_email references in RLS policies by making them table-specific

-- Fix newsletters table RLS policy
DROP POLICY IF EXISTS "Newsletters tier access" ON public.newsletters;
CREATE POLICY "Newsletters tier access" 
ON public.newsletters 
FOR SELECT 
USING (
  (status = 'published'::text) 
  AND (
    (required_tier = 'free'::subscription_tier) 
    OR (
      (required_tier = 'paid'::subscription_tier) 
      AND (get_current_user_tier() = ANY (ARRAY['paid'::subscription_tier, 'premium'::subscription_tier]))
    ) 
    OR (
      (required_tier = 'premium'::subscription_tier) 
      AND (get_current_user_tier() = 'premium'::subscription_tier)
    )
  )
);

-- Fix video_tutorials table RLS policy  
DROP POLICY IF EXISTS "video_tutorials_tier_access" ON public.video_tutorials;
CREATE POLICY "video_tutorials_tier_access" 
ON public.video_tutorials 
FOR SELECT 
USING (
  (status = 'published'::text) 
  AND (
    (required_tier = 'free'::subscription_tier) 
    OR (
      (required_tier = 'paid'::subscription_tier) 
      AND (get_current_user_tier() = ANY (ARRAY['paid'::subscription_tier, 'premium'::subscription_tier]))
    ) 
    OR (
      (required_tier = 'premium'::subscription_tier) 
      AND (get_current_user_tier() = 'premium'::subscription_tier)
    )
  )
);

-- Fix telegram_messages table RLS policy
DROP POLICY IF EXISTS "telegram_messages_premium_access" ON public.telegram_messages;
CREATE POLICY "telegram_messages_premium_access" 
ON public.telegram_messages 
FOR SELECT 
USING (
  (get_current_user_tier() = 'premium'::subscription_tier) 
  OR is_current_user_admin()
);