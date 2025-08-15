-- Fix telegram_messages policy to use proper authentication instead of hardcoded email
DROP POLICY IF EXISTS "telegram_messages_tier_access" ON public.telegram_messages;
CREATE POLICY "telegram_messages_tier_access" 
ON public.telegram_messages 
FOR SELECT 
USING (is_current_user_admin_fast() OR is_current_user_premium());

-- Add dashboard count access for content tables (for overview widgets)
-- Allow authenticated users to see counts without full content access
CREATE POLICY "newsletters_dashboard_counts" 
ON public.newsletters 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "articles_dashboard_counts" 
ON public.articles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "video_tutorials_dashboard_counts" 
ON public.video_tutorials 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "courses_dashboard_counts" 
ON public.courses 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to see user counts for dashboard stats
CREATE POLICY "admin_users_dashboard_counts" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "whop_authenticated_users_dashboard_counts" 
ON public.whop_authenticated_users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update analyst_signals to use proper authentication
DROP POLICY IF EXISTS "analyst_signals_admin_all" ON public.analyst_signals;
CREATE POLICY "analyst_signals_admin_all" 
ON public.analyst_signals 
FOR ALL 
USING (is_current_user_admin_fast());

-- Allow authenticated users to view active analyst signals
CREATE POLICY "analyst_signals_public_read" 
ON public.analyst_signals 
FOR SELECT 
USING ((status = 'active') AND (auth.uid() IS NOT NULL));