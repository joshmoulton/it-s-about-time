-- Fix remaining performance issues in Supabase - Part 1: RLS Policies and Indexes

-- 1. Fix remaining RLS policies that still have Auth RLS warnings
-- Update policies to use our security definer functions

-- Fix whop_authenticated_users policies if they exist
DROP POLICY IF EXISTS "Users can view their whop data" ON public.whop_authenticated_users;
CREATE POLICY "Users can view their whop data" 
ON public.whop_authenticated_users 
FOR SELECT 
USING (user_email = get_jwt_email());

-- Fix user_telegram_permissions policies if they exist
DROP POLICY IF EXISTS "Users can view their telegram permissions" ON public.user_telegram_permissions;
CREATE POLICY "Users can view their telegram permissions" 
ON public.user_telegram_permissions 
FOR SELECT 
USING (user_id = get_beehiiv_subscriber_id());

-- Fix user_sessions policies if they exist
DROP POLICY IF EXISTS "Users can view their sessions" ON public.user_sessions;
CREATE POLICY "Users can view their sessions" 
ON public.user_sessions 
FOR SELECT 
USING (subscriber_id = get_beehiiv_subscriber_id());

-- Fix user_roles policies if they exist
DROP POLICY IF EXISTS "Users can view their roles" ON public.user_roles;
CREATE POLICY "Users can view their roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = get_current_user_id());

-- Fix video_tutorials policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can update video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can delete video tutorials" ON public.video_tutorials;

CREATE POLICY "Premium users can manage video tutorials" 
ON public.video_tutorials 
FOR ALL 
USING (user_has_premium_tier() OR has_admin_role('admin'));

-- 2. Add missing indexes for foreign keys to improve performance

-- Add indexes for analyst_call_detections foreign keys
CREATE INDEX IF NOT EXISTS idx_analyst_call_detections_analyst_signal_id 
ON public.analyst_call_detections(analyst_signal_id);

CREATE INDEX IF NOT EXISTS idx_analyst_call_detections_pattern_id 
ON public.analyst_call_detections(pattern_id);

CREATE INDEX IF NOT EXISTS idx_analyst_call_detections_telegram_message_id 
ON public.analyst_call_detections(telegram_message_id);

-- Add indexes for analyst_call_patterns foreign keys
CREATE INDEX IF NOT EXISTS idx_analyst_call_patterns_analyst_id 
ON public.analyst_call_patterns(analyst_id);

-- Add indexes for analyst_channel_config foreign keys
CREATE INDEX IF NOT EXISTS idx_analyst_channel_config_analyst_id 
ON public.analyst_channel_config(analyst_id);

-- Add indexes for auto_highlights foreign keys
CREATE INDEX IF NOT EXISTS idx_auto_highlights_rule_id 
ON public.auto_highlights(rule_id);

CREATE INDEX IF NOT EXISTS idx_auto_highlights_telegram_message_id 
ON public.auto_highlights(telegram_message_id);

-- Add indexes for chat_highlights foreign keys
CREATE INDEX IF NOT EXISTS idx_chat_highlights_promoted_by 
ON public.chat_highlights(promoted_by);

CREATE INDEX IF NOT EXISTS idx_chat_highlights_telegram_message_id 
ON public.chat_highlights(telegram_message_id);

-- Add indexes for comment_votes foreign keys
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id 
ON public.comment_votes(comment_id);

-- Add indexes for content_analytics foreign keys
CREATE INDEX IF NOT EXISTS idx_content_analytics_user_id 
ON public.content_analytics(user_id);

-- Add indexes for course_modules foreign keys
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id 
ON public.course_modules(course_id);

-- Add indexes for degen_call_notifications foreign keys
CREATE INDEX IF NOT EXISTS idx_degen_call_notifications_analyst_signal_id 
ON public.degen_call_notifications(analyst_signal_id);

-- Add indexes for highlight_comments foreign keys
CREATE INDEX IF NOT EXISTS idx_highlight_comments_parent_comment_id 
ON public.highlight_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_highlight_comments_topic_id 
ON public.highlight_comments(topic_id);

-- Add indexes for newsletters foreign keys
CREATE INDEX IF NOT EXISTS idx_newsletters_author_id 
ON public.newsletters(author_id);

-- Add indexes for telegram_sentiment_analysis foreign keys
CREATE INDEX IF NOT EXISTS idx_telegram_sentiment_analysis_telegram_message_id 
ON public.telegram_sentiment_analysis(telegram_message_id);

-- Add indexes for x_posts foreign keys
CREATE INDEX IF NOT EXISTS idx_x_posts_account_id 
ON public.x_posts(account_id);

-- Add indexes for user_trading_profiles foreign keys
CREATE INDEX IF NOT EXISTS idx_user_trading_profiles_user_id 
ON public.user_trading_profiles(user_id);

-- Add indexes for user_sessions foreign keys
CREATE INDEX IF NOT EXISTS idx_user_sessions_subscriber_id 
ON public.user_sessions(subscriber_id);

-- Add indexes for user_roles foreign keys
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);