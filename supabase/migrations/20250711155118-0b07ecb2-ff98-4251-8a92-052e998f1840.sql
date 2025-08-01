-- Fix Supabase RLS Policy Issues - Part 3: Final cleanup and optimization

-- Fix remaining tables with auth-related RLS issues

-- Fix telegram_sentiment_analysis policies
DROP POLICY IF EXISTS "Authenticated users can view sentiment analysis" ON public.telegram_sentiment_analysis;
DROP POLICY IF EXISTS "Service role can manage sentiment analysis" ON public.telegram_sentiment_analysis;

CREATE POLICY "Sentiment analysis read" ON public.telegram_sentiment_analysis
FOR SELECT USING (true); -- Allow all authenticated users

CREATE POLICY "Sentiment analysis system management" ON public.telegram_sentiment_analysis
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix telegram_topic_mappings policies
DROP POLICY IF EXISTS "Admin users can manage topic mappings" ON public.telegram_topic_mappings;
DROP POLICY IF EXISTS "Allow authenticated users to manage topic mappings" ON public.telegram_topic_mappings;
DROP POLICY IF EXISTS "Allow authenticated users to view topic mappings" ON public.telegram_topic_mappings;
DROP POLICY IF EXISTS "Anyone can view active topic mappings" ON public.telegram_topic_mappings;

CREATE POLICY "Topic mappings read" ON public.telegram_topic_mappings
FOR SELECT USING (is_active = true OR is_active IS NULL OR is_current_user_admin());

CREATE POLICY "Topic mappings management" ON public.telegram_topic_mappings
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix analyst_channel_config policies
DROP POLICY IF EXISTS "Admins can manage channel config" ON public.analyst_channel_config;
DROP POLICY IF EXISTS "Service role can read channel config" ON public.analyst_channel_config;

CREATE POLICY "Channel config read" ON public.analyst_channel_config
FOR SELECT USING (is_current_user_admin());

CREATE POLICY "Channel config management" ON public.analyst_channel_config
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix x_posts policies
DROP POLICY IF EXISTS "Admins can view X posts" ON public.x_posts;
DROP POLICY IF EXISTS "Authenticated users can view X posts" ON public.x_posts;
DROP POLICY IF EXISTS "Service role can manage X posts" ON public.x_posts;

CREATE POLICY "X posts read" ON public.x_posts
FOR SELECT USING (true); -- Allow all users to read

CREATE POLICY "X posts management" ON public.x_posts
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix x_account_monitoring policies
DROP POLICY IF EXISTS "Admins can manage X account monitoring" ON public.x_account_monitoring;
DROP POLICY IF EXISTS "Service role can manage X account monitoring" ON public.x_account_monitoring;

CREATE POLICY "X account monitoring management" ON public.x_account_monitoring
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix encrypted_user_data policies
DROP POLICY IF EXISTS "Super admins can manage encrypted data" ON public.encrypted_user_data;

CREATE POLICY "Encrypted data super admin access" ON public.encrypted_user_data
FOR ALL USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

-- Fix data_access_quotas policies
DROP POLICY IF EXISTS "Admins can view their own quotas" ON public.data_access_quotas;
DROP POLICY IF EXISTS "Super admins can manage all quotas" ON public.data_access_quotas;

CREATE POLICY "Data quotas read" ON public.data_access_quotas
FOR SELECT USING (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
);

CREATE POLICY "Data quotas management" ON public.data_access_quotas
FOR ALL USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

-- Create missing tables policies that might be needed

-- Add policy for course_modules if it exists
DROP POLICY IF EXISTS "Course modules access" ON public.course_modules;
CREATE POLICY "Course modules read" ON public.course_modules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_modules.course_id 
    AND (
      (c.status = 'published' AND (
        (c.required_tier = 'free') OR
        (c.required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
        (c.required_tier = 'premium' AND get_current_user_tier() = 'premium')
      )) OR 
      is_current_user_admin()
    )
  )
);

CREATE POLICY "Course modules management" ON public.course_modules
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Add policy for content_analytics if it exists
DROP POLICY IF EXISTS "Content analytics access" ON public.content_analytics;
CREATE POLICY "Content analytics read" ON public.content_analytics
FOR SELECT USING (
  user_id = auth.uid() OR is_current_user_admin()
);

CREATE POLICY "Content analytics insert" ON public.content_analytics
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_current_user_admin()
);

-- Add policies for tables that might need RLS but don't have it
-- Enable RLS on tables that should have it
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Telegram messages read" ON public.telegram_messages;
CREATE POLICY "Telegram messages read" ON public.telegram_messages
FOR SELECT USING (true); -- Allow all users to read messages

-- Ensure highlight_topics has proper policies
DROP POLICY IF EXISTS "Highlight topics read" ON public.highlight_topics;
CREATE POLICY "Highlight topics read" ON public.highlight_topics
FOR SELECT USING (true); -- Allow all users to read topics

-- Create policies for backup_history if needed
DROP POLICY IF EXISTS "Backup history admin access" ON public.backup_history;
CREATE POLICY "Backup history admin access" ON public.backup_history
FOR SELECT USING (is_current_user_admin());

-- Create policies for chat_highlight_rules if needed
DROP POLICY IF EXISTS "Chat highlight rules admin access" ON public.chat_highlight_rules;
CREATE POLICY "Chat highlight rules read" ON public.chat_highlight_rules
FOR SELECT USING (is_current_user_admin());

CREATE POLICY "Chat highlight rules management" ON public.chat_highlight_rules
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create policies for auto_highlights if needed
DROP POLICY IF EXISTS "Auto highlights read" ON public.auto_highlights;
CREATE POLICY "Auto highlights read" ON public.auto_highlights
FOR SELECT USING (is_current_user_admin());

-- Create policies for analyst_call_patterns if needed
DROP POLICY IF EXISTS "Analyst call patterns access" ON public.analyst_call_patterns;
CREATE POLICY "Analyst call patterns management" ON public.analyst_call_patterns
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());