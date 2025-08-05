-- Fix remaining ambiguous column references systematically

-- Drop and recreate telegram_messages policies to fix ambiguous references
DROP POLICY IF EXISTS "telegram_messages_premium_access" ON public.telegram_messages;
DROP POLICY IF EXISTS "telegram_messages_tier_access" ON public.telegram_messages;

CREATE POLICY "telegram_messages_premium_access" 
ON public.telegram_messages 
FOR ALL
USING (
  (get_current_user_tier() IN ('paid', 'premium')) OR 
  is_current_user_admin_fast()
);

-- Fix video_tutorials table - drop existing and recreate
DROP POLICY IF EXISTS "video_tutorials_tier_access" ON public.video_tutorials;
DROP POLICY IF EXISTS "Video tutorials tier access" ON public.video_tutorials;

CREATE POLICY "video_tutorials_tier_access"
ON public.video_tutorials
FOR SELECT
USING (
  video_tutorials.status = 'published' AND (
    video_tutorials.required_tier = 'free' OR
    (video_tutorials.required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (video_tutorials.required_tier = 'premium' AND get_current_user_tier() = 'premium') OR
    is_current_user_admin_fast()
  )
);

-- Create admin policy for video_tutorials
CREATE POLICY "video_tutorials_admin_all"
ON public.video_tutorials
FOR ALL
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());