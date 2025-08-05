-- Comprehensive fix for all remaining ambiguous user_email references

-- Fix telegram_messages RLS policies
DROP POLICY IF EXISTS "telegram_messages_access" ON public.telegram_messages;
CREATE POLICY "telegram_messages_access" 
ON public.telegram_messages 
FOR ALL
USING (
  (get_current_user_tier() IN ('paid', 'premium')) OR 
  is_current_user_admin_fast()
);

-- Fix video_tutorials RLS policies  
DROP POLICY IF EXISTS "video_tutorials_tier_access" ON public.video_tutorials;
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

-- Fix newsletters RLS policy (ensure it uses fully qualified table names)
DROP POLICY IF EXISTS "Users can view newsletters based on tier" ON public.newsletters;
CREATE POLICY "newsletters_tier_access"
ON public.newsletters
FOR SELECT
USING (
  newsletters.status = 'published' AND (
    newsletters.required_tier = 'free' OR
    (newsletters.required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (newsletters.required_tier = 'premium' AND get_current_user_tier() = 'premium') OR
    is_current_user_admin_fast()
  )
);

-- Ensure admin access policies don't have ambiguous references
DROP POLICY IF EXISTS "newsletters_admin_access" ON public.newsletters;
CREATE POLICY "newsletters_admin_access"
ON public.newsletters
FOR ALL
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());